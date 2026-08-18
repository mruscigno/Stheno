import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  completionSummary,
  detectPersonalRecords,
  effectiveWorkout,
  nextIncompleteSet,
  type SetPerformance,
} from "@/modules/workout/logic";
import {
  TRAINING_ENGINE_VERSION,
  TRAINING_RULESET_VERSION,
} from "@/modules/training/methodology";
import type { TrainingProgram, Workout } from "@/modules/training/types";
const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), clientSessionKey: z.uuid() }),
  z.object({
    action: z.literal("set"),
    sessionId: z.uuid(),
    idempotencyKey: z.uuid(),
    exerciseSlug: z.string(),
    setOrdinal: z.number().int().min(1).max(20),
    load: z.number().min(0),
    reps: z.number().int().min(0).max(200),
    rir: z.number().min(0).max(10),
    state: z.enum(["completed", "skipped"]),
    prescribed: z.record(z.string(), z.unknown()),
  }),
  z.object({
    action: z.literal("replace"),
    sessionId: z.uuid(),
    exerciseSlug: z.string(),
    replacementSlug: z.string(),
    reason: z.enum([
      "equipment_unavailable",
      "equipment_occupied",
      "discomfort",
      "dislike",
      "temporary_limitation",
      "other",
    ]),
    scope: z.enum(["session_only", "program", "persistent"]),
    confirmedSafety: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("short_time"),
    sessionId: z.uuid(),
    availableMinutes: z.number().int().min(15).max(180),
  }),
  z.object({ action: z.literal("complete"), sessionId: z.uuid() }),
]);
async function auth() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}
async function latestPrescription(
  ctx: NonNullable<Awaited<ReturnType<typeof auth>>>,
) {
  return ctx.supabase
    .from("program_prescriptions")
    .select("id,prescription,profile_snapshot_id")
    .eq("user_id", ctx.user.id)
    .order("prescribed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}
export async function GET() {
  const ctx = await auth();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: active } = await ctx.supabase
    .from("workout_execution_sessions")
    .select("*")
    .eq("user_id", ctx.user.id)
    .in("status", ["active", "paused"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active) {
    const { data: sets } = await ctx.supabase
      .from("workout_set_logs")
      .select(
        "exercise_slug,set_ordinal,load_value,repetitions,rir,state,performed_at",
      )
      .eq("user_id", ctx.user.id)
      .eq("workout_execution_session_id", active.id)
      .order("performed_at");
    const workout = effectiveWorkout(
        active.original_workout as Workout,
        active.revised_workout as Workout | null,
      ),
      next = nextIncompleteSet(
        workout,
        (sets ?? []).map((s) => ({
          exerciseSlug: s.exercise_slug,
          setOrdinal: s.set_ordinal,
          load: Number(s.load_value ?? 0),
          reps: Number(s.repetitions ?? 0),
          rir: Number(s.rir ?? 0),
          state: s.state,
        })) as SetPerformance[],
      );
    let lastPerformance: null | { load: number; reps: number } = null;
    if (next) {
      const { data: last } = await ctx.supabase
        .from("workout_set_logs")
        .select("load_value,repetitions")
        .eq("user_id", ctx.user.id)
        .eq("exercise_slug", next.exercise.exerciseSlug)
        .eq("state", "completed")
        .neq("workout_execution_session_id", active.id)
        .order("performed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last)
        lastPerformance = {
          load: Number(last.load_value ?? 0),
          reps: Number(last.repetitions),
        };
    }
    return NextResponse.json({
      state: "active",
      session: active,
      workout,
      sets: sets ?? [],
      next,
      lastPerformance,
    });
  }
  const { data: prescription } = await latestPrescription(ctx);
  if (!prescription) return NextResponse.json({ state: "no_program" });
  const program = prescription.prescription as TrainingProgram;
  const workout = program.workouts[0] ?? null;
  return NextResponse.json({
    state: workout ? "preview" : "no_workout",
    programPrescriptionId: prescription.id,
    workout,
  });
}
export async function POST(request: Request) {
  const ctx = await auth();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Action.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "That workout update wasn’t recognized." },
      { status: 400 },
    );
  const body = parsed.data;
  if (body.action === "start") {
    const { data: existing } = await ctx.supabase
      .from("workout_execution_sessions")
      .select("id")
      .eq("user_id", ctx.user.id)
      .eq("client_session_key", body.clientSessionKey)
      .maybeSingle();
    if (existing)
      return NextResponse.json({ sessionId: existing.id, resumed: true });
    const { data: prescription } = await latestPrescription(ctx);
    if (!prescription)
      return NextResponse.json(
        { error: "Build your program before starting a workout." },
        { status: 409 },
      );
    const program = prescription.prescription as TrainingProgram;
    const workout = program.workouts[0];
    if (!workout)
      return NextResponse.json(
        { error: "No scheduled workout" },
        { status: 409 },
      );
    const { data, error } = await ctx.supabase
      .from("workout_execution_sessions")
      .insert({
        user_id: ctx.user.id,
        program_prescription_id: prescription.id,
        workout_key: workout.key,
        status: "active",
        original_workout: workout,
        client_session_key: body.clientSessionKey,
      })
      .select("id")
      .single();
    return error
      ? NextResponse.json({ error: "Unable to start workout" }, { status: 500 })
      : NextResponse.json({ sessionId: data.id }, { status: 201 });
  }
  const { data: session } = await ctx.supabase
    .from("workout_execution_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .eq("user_id", ctx.user.id)
    .single();
  if (!session)
    return NextResponse.json(
      { error: "Workout session not found" },
      { status: 404 },
    );
  const workout = effectiveWorkout(
    session.original_workout as Workout,
    session.revised_workout as Workout | null,
  );
  if (body.action === "set") {
    const { data: history } = await ctx.supabase
      .from("workout_set_logs")
      .select("exercise_slug,set_ordinal,load_value,repetitions,rir,state")
      .eq("user_id", ctx.user.id)
      .eq("exercise_slug", body.exerciseSlug);
    const candidate: SetPerformance = {
      exerciseSlug: body.exerciseSlug,
      setOrdinal: body.setOrdinal,
      load: body.load,
      reps: body.reps,
      rir: body.rir,
      state: body.state,
    };
    const prs = detectPersonalRecords(
      (history ?? []).map((s) => ({
        exerciseSlug: s.exercise_slug,
        setOrdinal: s.set_ordinal,
        load: Number(s.load_value ?? 0),
        reps: Number(s.repetitions ?? 0),
        rir: Number(s.rir ?? 0),
        state: s.state,
      })) as SetPerformance[],
      candidate,
    );
    const { error } = await ctx.supabase
      .from("workout_set_logs")
      .upsert(
        {
          user_id: ctx.user.id,
          workout_execution_session_id: session.id,
          exercise_slug: body.exerciseSlug,
          set_ordinal: body.setOrdinal,
          prescribed: body.prescribed,
          load_value: body.load,
          repetitions: body.reps,
          rir: body.rir,
          state: body.state,
          idempotency_key: body.idempotencyKey,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,idempotency_key" },
      );
    if (error)
      return NextResponse.json(
        { error: "That set didn’t save. Check your connection and try again." },
        { status: 500 },
      );
    if (prs.length)
      await ctx.supabase.from("personal_records").upsert(
        prs.map((pr) => ({
          user_id: ctx.user.id,
          workout_execution_session_id: session.id,
          exercise_slug: body.exerciseSlug,
          record_type: pr.type,
          value: pr.value,
          context: { load: body.load, reps: body.reps },
          engine_version: TRAINING_ENGINE_VERSION,
          ruleset_version: TRAINING_RULESET_VERSION,
        })),
        {
          onConflict: "user_id,exercise_slug,record_type,value",
          ignoreDuplicates: true,
        },
      );
    const { data: sessionSets } = await ctx.supabase
      .from("workout_set_logs")
      .select("exercise_slug,set_ordinal,load_value,repetitions,rir,state")
      .eq("user_id", ctx.user.id)
      .eq("workout_execution_session_id", session.id);
    const next = nextIncompleteSet(
      workout,
      (sessionSets ?? []).map((s) => ({
        exerciseSlug: s.exercise_slug,
        setOrdinal: s.set_ordinal,
        load: Number(s.load_value ?? 0),
        reps: Number(s.repetitions ?? 0),
        rir: Number(s.rir ?? 0),
        state: s.state,
      })) as SetPerformance[],
    );
    await ctx.supabase
      .from("workout_execution_sessions")
      .update({
        current_exercise_index:
          next?.exerciseIndex ?? workout.exercises.length - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("user_id", ctx.user.id);
    return NextResponse.json({ saved: true, personalRecords: prs, next });
  }
  if (body.action === "replace") {
    if (body.reason === "discomfort" && !body.confirmedSafety)
      return NextResponse.json({
        safety: {
          classification: "modify",
          message:
            "Don’t train through significant pain. Choose a comfortable alternative only if it feels appropriate; seek qualified care for severe, sudden, or persistent symptoms.",
        },
        confirmationRequired: true,
      });
    const index = workout.exercises.findIndex(
      (e) => e.exerciseSlug === body.exerciseSlug,
    );
    if (index < 0)
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 },
      );
    const target = workout.exercises[index];
    if (!target.alternatives.includes(body.replacementSlug))
      return NextResponse.json(
        { error: "That replacement is not available for this exercise" },
        { status: 422 },
      );
    const replacementName = body.replacementSlug.replaceAll("-", " "),
      replaceExercise = (e: Workout["exercises"][number]) =>
        e.exerciseSlug === body.exerciseSlug
          ? {
              ...e,
              exerciseSlug: body.replacementSlug,
              exerciseName: replacementName,
              reasonCodes: [...e.reasonCodes, "ENGINE_RANKED_REPLACEMENT"],
            }
          : e,
      revised = {
        ...workout,
        exercises: workout.exercises.map(replaceExercise),
      },
      writes = [
        ctx.supabase
          .from("workout_execution_sessions")
          .update({
            revised_workout: revised,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id)
          .eq("user_id", ctx.user.id),
        ctx.supabase
          .from("workout_session_adaptations")
          .insert({
            user_id: ctx.user.id,
            workout_execution_session_id: session.id,
            adaptation_type: "exercise_replacement",
            reason: body.reason,
            scope: body.scope,
            original_state: target,
            revised_state: revised.exercises[index],
            reason_codes: [
              "ENGINE_RANKED_REPLACEMENT",
              `SCOPE_${body.scope.toUpperCase()}`,
            ],
            engine_version: TRAINING_ENGINE_VERSION,
            ruleset_version: TRAINING_RULESET_VERSION,
          }),
      ];
    if (body.scope !== "session_only") {
      const { data: current } = await ctx.supabase
        .from("program_prescriptions")
        .select("prescription")
        .eq("id", session.program_prescription_id)
        .eq("user_id", ctx.user.id)
        .single();
      if (current) {
        const program = current.prescription as TrainingProgram,
          persisted = {
            ...program,
            workouts: program.workouts.map((day) => ({
              ...day,
              exercises: day.exercises.map(replaceExercise),
            })),
          };
        writes.push(
          ctx.supabase
            .from("program_prescriptions")
            .update({ prescription: persisted })
            .eq("id", session.program_prescription_id)
            .eq("user_id", ctx.user.id),
        );
      }
    }
    if (body.scope === "persistent")
      writes.push(
        ctx.supabase
          .from("exercise_replacement_preferences")
          .upsert(
            {
              user_id: ctx.user.id,
              original_slug: body.exerciseSlug,
              replacement_slug: body.replacementSlug,
              reason: body.reason,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,original_slug" },
          ),
      );
    const results = await Promise.all(writes);
    if (results.some((result) => result.error))
      return NextResponse.json(
        { error: "The replacement could not be saved. Please try again." },
        { status: 500 },
      );
    return NextResponse.json({
      workout: revised,
      message:
        body.scope === "session_only"
          ? "Replacement applied for today."
          : body.scope === "program"
            ? "Replacement applied to this program."
            : "Replacement preference saved.",
    });
  }
  if (body.action === "short_time") {
    const exercises = [...workout.exercises];
    while (
      exercises.reduce((n, e) => n + e.estimatedMinutes, 5) >
        body.availableMinutes &&
      exercises.length > 2
    ) {
      const lowest = exercises
        .map((e, i) => ({
          i,
          p: e.role === "primary" ? 3 : e.role === "secondary" ? 2 : 1,
        }))
        .sort((a, b) => a.p - b.p || b.i - a.i)[0];
      exercises.splice(lowest.i, 1);
    }
    const revised = {
      ...workout,
      estimatedMinutes: Math.min(
        body.availableMinutes,
        exercises.reduce((n, e) => n + e.estimatedMinutes, 5),
      ),
      exercises,
      reasonCodes: [...workout.reasonCodes, "TIME_BUDGET_HONORED"],
    };
    await Promise.all([
      ctx.supabase
        .from("workout_execution_sessions")
        .update({
          revised_workout: revised,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id)
        .eq("user_id", ctx.user.id),
      ctx.supabase
        .from("workout_session_adaptations")
        .insert({
          user_id: ctx.user.id,
          workout_execution_session_id: session.id,
          adaptation_type: "time_constraint",
          reason: "short_on_time",
          original_state: workout,
          revised_state: revised,
          reason_codes: ["PRIORITY_STIMULUS_PRESERVED", "TIME_BUDGET_HONORED"],
          engine_version: TRAINING_ENGINE_VERSION,
          ruleset_version: TRAINING_RULESET_VERSION,
        }),
    ]);
    return NextResponse.json({ workout: revised });
  }
  const completedAt = new Date().toISOString();
  const { data: sets } = await ctx.supabase
    .from("workout_set_logs")
    .select("exercise_slug,set_ordinal,load_value,repetitions,rir,state")
    .eq("user_id", ctx.user.id)
    .eq("workout_execution_session_id", session.id);
  const summary = completionSummary(
    workout,
    (sets ?? []).map((s) => ({
      exerciseSlug: s.exercise_slug,
      setOrdinal: s.set_ordinal,
      load: Number(s.load_value ?? 0),
      reps: Number(s.repetitions ?? 0),
      rir: Number(s.rir ?? 0),
      state: s.state,
    })) as SetPerformance[],
    session.started_at,
    completedAt,
  );
  await ctx.supabase
    .from("workout_execution_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq("id", session.id)
    .eq("user_id", ctx.user.id);
  return NextResponse.json({ completed: true, summary });
}
