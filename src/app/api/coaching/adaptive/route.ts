import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ADAPTIVE_RULESET_VERSION,
  evaluateRecovery,
  evaluateTrainingBalance,
  evaluateVolume,
  resolvePhase,
} from "@/modules/adaptive-coaching/engine";
import type { TrainingProgram } from "@/modules/training/types";

async function context() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function GET() {
  const ctx = await context();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [prescriptionResult, sessionsResult, checkinResult, recoveryResult] =
    await Promise.all([
      ctx.supabase
        .from("program_prescriptions")
        .select("id,prescription,prescribed_at")
        .eq("user_id", ctx.user.id)
        .order("prescribed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      ctx.supabase
        .from("workout_execution_sessions")
        .select(
          "id,status,started_at,completed_at,session_effort,completion_summary,original_workout",
        )
        .eq("user_id", ctx.user.id)
        .order("started_at", { ascending: false })
        .limit(24),
      ctx.supabase
        .from("weekly_checkins")
        .select("created_at,training_performance,recovery,energy,sleep")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      ctx.supabase
        .from("recovery_observations")
        .select("response,created_at")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  const row = prescriptionResult.data,
    program = row?.prescription as TrainingProgram | undefined;
  if (!program) return NextResponse.json({ state: "empty" });
  const elapsedWeeks = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(row!.prescribed_at).getTime()) / (7 * 86400000),
      ) + 1,
    ),
    currentWeek = Math.min(program.weeks, elapsedWeeks),
    phase = resolvePhase(currentWeek, program.weeks);
  const sessions = sessionsResult.data ?? [],
    completed = sessions.filter((s) => s.status === "completed"),
    plannedSets = sessions.reduce(
      (total, s) =>
        total +
        (
          (s.original_workout as { exercises?: { sets?: number }[] })
            ?.exercises ?? []
        ).reduce((sum, e) => sum + Number(e.sets ?? 0), 0),
      0,
    ),
    completedSets = completed.reduce(
      (total, s) =>
        total +
        Number(
          (s.completion_summary as { completedSets?: number } | null)
            ?.completedSets ?? 0,
        ),
      0,
    );
  const balance = evaluateTrainingBalance(plannedSets, completedSets),
    latest = completed[0],
    daysSinceTraining = latest?.completed_at
      ? (Date.now() - new Date(latest.completed_at).getTime()) / 86400000
      : null,
    latestCheckin = checkinResult.data as {
      training_performance?: string;
      recovery?: number;
    } | null;
  const recovery = evaluateRecovery({
    daysSinceTraining,
    soreness:
      (recoveryResult.data?.response as
        "fully_recovered" | "little_sore" | "very_sore" | "not_sure" | null) ??
      null,
    hardSessions7d: completed.filter(
      (s) =>
        Date.now() - new Date(s.completed_at ?? s.started_at).getTime() <
          7 * 86400000 &&
        ["very_hard", "couldnt_finish"].includes(String(s.session_effort)),
    ).length,
    decliningPerformance: latestCheckin?.training_performance === "declining",
  });
  const volume = evaluateVolume({
    observations: completed.length,
    adherence: plannedSets ? completedSets / plannedSets : null,
    performanceTrend:
      (latestCheckin?.training_performance as
        "improving" | "stable" | "declining" | undefined) ?? "unknown",
    recovery: recovery.status,
  });
  return NextResponse.json({
    state: "ready",
    block: {
      name: program.block?.name ?? "Foundation",
      focus: program.block?.focus ?? program.name,
      currentWeek,
      durationWeeks: program.weeks,
      phase,
      status: currentWeek >= program.weeks ? "completing" : "active",
    },
    training: {
      completedWorkouts: completed.length,
      plannedSets,
      completedSets,
    },
    balance,
    recovery,
    volume,
    algorithmVersion: ADAPTIVE_RULESET_VERSION,
  });
}

const Action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("recovery_feedback"),
    response: z.enum([
      "fully_recovered",
      "little_sore",
      "very_sore",
      "not_sure",
    ]),
    muscleGroup: z.string().max(80).optional(),
    sessionId: z.uuid().optional(),
    scope: z.enum(["today", "plan"]).default("today"),
  }),
  z.object({ action: z.literal("guided_mode"), enabled: z.boolean() }),
  z.object({
    action: z.literal("next_block_priority"),
    blockId: z.uuid(),
    priority: z.string().trim().min(2).max(80),
  }),
]);
export async function POST(request: Request) {
  const ctx = await context();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Action.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid coaching action" },
      { status: 400 },
    );
  if (parsed.data.action === "guided_mode") {
    const { error } = await ctx.supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: ctx.user.id,
          guided_workout_mode: parsed.data.enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    return error
      ? NextResponse.json(
          { error: "Unable to save preference" },
          { status: 500 },
        )
      : NextResponse.json({ saved: true });
  }
  if (parsed.data.action === "recovery_feedback") {
    const { error } = await ctx.supabase
      .from("recovery_observations")
      .insert({
        user_id: ctx.user.id,
        workout_execution_session_id: parsed.data.sessionId,
        muscle_group: parsed.data.muscleGroup,
        response: parsed.data.response,
        scope: parsed.data.scope,
      });
    return error
      ? NextResponse.json(
          { error: "Unable to save recovery feedback" },
          { status: 500 },
        )
      : NextResponse.json({ saved: true });
  }
  const { error } = await ctx.supabase
    .from("training_block_priorities")
    .upsert(
      {
        user_id: ctx.user.id,
        block_id: parsed.data.blockId,
        priority: parsed.data.priority,
      },
      { onConflict: "block_id" },
    );
  return error
    ? NextResponse.json(
        { error: "Unable to save block priority" },
        { status: 500 },
      )
    : NextResponse.json({ saved: true });
}
