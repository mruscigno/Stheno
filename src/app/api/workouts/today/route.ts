import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  effectiveWorkout,
  nextIncompleteSet,
  type SetPerformance,
} from "@/modules/workout/logic";
import { summarizeWorkoutDeterministically, type SessionEffort } from "@/modules/training-intelligence";
import { buildWorkoutIntelligence, earnWorkoutAchievements, persistWeeklyWorkload, processSetIntelligence } from "@/modules/training-intelligence/server";
import { trainingIntelligenceFlags } from "@/modules/training-intelligence/flags";
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
    rir: z.number().min(0).max(10).nullable().optional(),
    rpe: z.number().min(1).max(10).nullable().optional(),
    setType: z.enum(["warmup", "working", "backoff", "drop", "failure", "optional"]).default("working"),
    recommendationId: z.uuid().nullable().optional(),
    clientTimestamp: z.iso.datetime().optional(),
    editSetId: z.uuid().optional(),
    isUserAdded: z.boolean().optional(),
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
  z.object({ action: z.literal("complete"), sessionId: z.uuid(), effort: z.enum(["too_easy", "about_right", "very_hard", "couldnt_finish"]), note: z.string().trim().max(2000).optional(), allowIncomplete: z.boolean().optional() }),
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
        "id,exercise_slug,set_ordinal,set_type,prescribed,load_value,load_unit,repetitions,rir,rpe,state,performed_at,is_user_added,recommendation_id",
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
    const intelligence = trainingIntelligenceFlags.calculations && trainingIntelligenceFlags.adaptiveLoads ? await buildWorkoutIntelligence(ctx.supabase, ctx.user.id, active.id, workout, active.program_prescription_id) : { previous: {}, recommendations: [] };
    return NextResponse.json({
      state: "active",
      session: active,
      workout,
      sets: sets ?? [],
      next,
      lastPerformance,
      previousPerformance: intelligence.previous,
      recommendations: intelligence.recommendations,
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
  if (session.status === "completed") {
    if (body.action === "complete") return NextResponse.json({ completed: true, summary: session.completion_summary, idempotent: true });
    return NextResponse.json({ error: "This workout is already complete." }, { status: 409 });
  }
  const workout = effectiveWorkout(
    session.original_workout as Workout,
    session.revised_workout as Workout | null,
  );
  if (body.action === "set") {
    const prescription = workout.exercises.find(exercise => exercise.exerciseSlug === body.exerciseSlug);
    if (!prescription) return NextResponse.json({ error: "Exercise not found in this workout" }, { status: 404 });
    const now = new Date().toISOString(), values = {
      prescribed: body.prescribed,
      prescribed_load: typeof body.prescribed.loadValue === "number" ? body.prescribed.loadValue : null,
      prescribed_reps_min: prescription.repMin,
      prescribed_reps_max: prescription.repMax,
      prescribed_rest_seconds: prescription.restSeconds,
      load_value: body.load,
      repetitions: body.reps,
      rir: body.rir ?? null,
      rpe: body.rpe ?? null,
      set_type: body.setType,
      state: body.state,
      is_user_added: body.isUserAdded ?? false,
      recommendation_id: body.recommendationId ?? null,
      client_performed_at: body.clientTimestamp ?? null,
      updated_at: now,
      invalidated_at: null,
    };
    let result;
    if (body.editSetId) {
      result = await ctx.supabase.from("workout_set_logs").update(values).eq("id", body.editSetId).eq("user_id", ctx.user.id).eq("workout_execution_session_id", session.id).select("*").single();
    } else {
      const { data: existing } = await ctx.supabase.from("workout_set_logs").select("id").eq("user_id", ctx.user.id).eq("workout_execution_session_id", session.id).eq("exercise_slug", body.exerciseSlug).eq("set_ordinal", body.setOrdinal).maybeSingle();
      result = existing
        ? await ctx.supabase.from("workout_set_logs").update(values).eq("id", existing.id).eq("user_id", ctx.user.id).select("*").single()
        : await ctx.supabase.from("workout_set_logs").insert({ user_id: ctx.user.id, workout_execution_session_id: session.id, exercise_slug: body.exerciseSlug, set_ordinal: body.setOrdinal, idempotency_key: body.idempotencyKey, performed_at: now, ...values }).select("*").single();
    }
    const { data: savedSet, error } = result;
    if (error)
      return NextResponse.json(
        { error: "That set didn’t save. Check your connection and try again." },
        { status: 500 },
      );
    const derived = trainingIntelligenceFlags.calculations ? await processSetIntelligence(ctx.supabase, ctx.user.id, session.id, savedSet, prescription, body.recommendationId) : { personalRecords: [], e1rm: null, setVolume: null };
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
    return NextResponse.json({ saved: true, set: savedSet, personalRecords: derived.personalRecords, estimated1RM: derived.e1rm, setVolume: derived.setVolume, next, restSeconds: prescription.restSeconds });
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
  const [{ data: sets }, { data: prs }] = await Promise.all([ctx.supabase
    .from("workout_set_logs")
    .select("id,exercise_slug,set_ordinal,set_type,load_value,load_unit,repetitions,rir,rpe,state,workout_execution_session_id,performed_at")
    .eq("user_id", ctx.user.id)
    .eq("workout_execution_session_id", session.id), ctx.supabase.from("personal_records").select("id,record_type,value,secondary_value,exercise_slug,unit,status").eq("user_id", ctx.user.id).eq("workout_execution_session_id", session.id).eq("status", "active")]);
  const prescribedSets = workout.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  const intelligenceSets = (sets ?? []).map(set => ({ id: set.id, exerciseSlug: set.exercise_slug, load: Number(set.load_value ?? 0), unit: set.load_unit, reps: Number(set.repetitions ?? 0), rir: set.rir == null ? null : Number(set.rir), rpe: set.rpe == null ? null : Number(set.rpe), setType: set.set_type, state: set.state, sessionId: set.workout_execution_session_id, performedAt: set.performed_at }));
  const completedWorking = intelligenceSets.filter(set => set.state === "completed" && set.setType !== "warmup").length;
  if (completedWorking < prescribedSets && !body.allowIncomplete) return NextResponse.json({ confirmationRequired: true, remainingSets: prescribedSets - completedWorking, message: `${prescribedSets - completedWorking} planned sets remain. Finish anyway?` });
  const summary = summarizeWorkoutDeterministically({ startedAt: session.started_at, completedAt, prescribedSets, sets: intelligenceSets, prs: prs ?? [], effort: body.effort as SessionEffort });
  await ctx.supabase
    .from("workout_execution_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      duration_seconds: summary.durationSeconds,
      session_effort: body.effort,
      completion_notes: body.note ?? null,
      completion_summary: summary,
      completion_summary_version: summary.version,
      updated_at: completedAt,
    })
    .eq("id", session.id)
    .eq("user_id", ctx.user.id);
  const [workload, achievements] = await Promise.all([trainingIntelligenceFlags.muscleWorkload ? persistWeeklyWorkload(ctx.supabase, ctx.user.id, workout, sets ?? [], completedAt) : {}, trainingIntelligenceFlags.achievements ? earnWorkoutAchievements(ctx.supabase, ctx.user.id, session.id, completedAt, prs?.length ?? 0) : []]);
  return NextResponse.json({ completed: true, summary, personalRecords: prs ?? [], achievements, workload, nextWorkout: "Your next planned workout is available on your program calendar." });
}
