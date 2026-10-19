import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { CompleteWorkoutInput, StartWorkoutInput, UpsertWorkoutSetInput } from "@/platform/contracts/api";
import { summarizeWorkoutDeterministically, type SessionEffort } from "@/modules/training-intelligence";
import { earnWorkoutAchievements, persistWeeklyWorkload, processSetIntelligence } from "@/modules/training-intelligence/server";
import { effectiveWorkout } from "@/modules/workout/logic";
import type { TrainingProgram, Workout } from "@/modules/training/types";

type StartInput = z.infer<typeof StartWorkoutInput>;
type SetInput = z.infer<typeof UpsertWorkoutSetInput>;
type CompleteInput = z.infer<typeof CompleteWorkoutInput>;

export async function startWorkout(db: SupabaseClient, userId: string, input: StartInput) {
  const { data: existing } = await db.from("workout_execution_sessions").select("id,status,updated_at").eq("user_id", userId).eq("client_session_key", input.clientSessionKey).maybeSingle();
  if (existing) return { ...existing, resumed: true };
  const { data: prescription, error: prescriptionError } = await db.from("program_prescriptions").select("id,prescription").eq("user_id", userId).order("prescribed_at", { ascending: false }).limit(1).maybeSingle();
  if (prescriptionError) throw new Error(`PROGRAM_READ_FAILED:${prescriptionError.message}`);
  if (!prescription) return null;
  const program = prescription.prescription as TrainingProgram;
  const workout = input.workoutKey ? program.workouts.find((item) => item.key === input.workoutKey) : program.workouts[0];
  if (!workout) return null;
  const { data, error } = await db.from("workout_execution_sessions").insert({ user_id: userId, program_prescription_id: prescription.id, workout_key: workout.key, status: "active", original_workout: workout, client_session_key: input.clientSessionKey }).select("id,status,updated_at").single();
  if (error?.code === "23505") {
    const { data: raced } = await db.from("workout_execution_sessions").select("id,status,updated_at").eq("user_id", userId).eq("client_session_key", input.clientSessionKey).single();
    return raced ? { ...raced, resumed: true } : null;
  }
  if (error) throw new Error(`WORKOUT_START_FAILED:${error.message}`);
  return { ...data, resumed: false };
}

async function ownedSession(db: SupabaseClient, userId: string, sessionId: string) {
  const { data, error } = await db.from("workout_execution_sessions").select("*").eq("id", sessionId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`WORKOUT_SESSION_READ_FAILED:${error.message}`);
  return data;
}

export async function upsertWorkoutSet(db: SupabaseClient, userId: string, sessionId: string, setId: string, input: SetInput) {
  const session = await ownedSession(db, userId, sessionId);
  if (!session) return { state: "not_found" as const };
  if (session.status === "completed") return { state: "completed" as const };
  const workout = effectiveWorkout(session.original_workout as Workout, session.revised_workout as Workout | null);
  const prescription = workout.exercises.find((item) => item.exerciseSlug === input.exerciseSlug);
  if (!prescription) return { state: "exercise_not_found" as const };
  const now = new Date().toISOString();
  const values = {
    prescribed: input.prescribed,
    prescribed_load: typeof input.prescribed.loadValue === "number" ? input.prescribed.loadValue : null,
    prescribed_reps_min: prescription.repMin,
    prescribed_reps_max: prescription.repMax,
    prescribed_rest_seconds: prescription.restSeconds,
    load_value: input.load ?? null,
    load_unit: input.loadUnit,
    repetitions: input.repetitions ?? null,
    rir: input.rir ?? null,
    rpe: input.rpe ?? null,
    set_type: input.setType,
    state: input.state,
    client_performed_at: input.clientTimestamp ?? null,
    updated_at: now,
    invalidated_at: null,
  };
  const { data: byOperation } = await db.from("workout_set_logs").select("*").eq("user_id", userId).eq("idempotency_key", input.operationId).maybeSingle();
  if (byOperation) return { state: "saved" as const, set: byOperation, replayed: true, personalRecords: [], estimated1RM: null, setVolume: null, restSeconds: prescription.restSeconds };
  const { data: existing } = await db.from("workout_set_logs").select("id").eq("id", setId).eq("user_id", userId).eq("workout_execution_session_id", sessionId).maybeSingle();
  const result = existing
    ? await db.from("workout_set_logs").update(values).eq("id", existing.id).eq("user_id", userId).select("*").single()
    : await db.from("workout_set_logs").insert({ id: setId, user_id: userId, workout_execution_session_id: sessionId, exercise_slug: input.exerciseSlug, set_ordinal: input.setOrdinal, idempotency_key: input.operationId, performed_at: input.clientTimestamp ?? now, ...values }).select("*").single();
  if (result.error) throw new Error(`WORKOUT_SET_SAVE_FAILED:${result.error.message}`);
  const derived = await processSetIntelligence(db, userId, sessionId, result.data, prescription, null);
  await db.from("workout_execution_sessions").update({ updated_at: now }).eq("id", sessionId).eq("user_id", userId);
  return { state: "saved" as const, set: result.data, replayed: false, personalRecords: derived.personalRecords, estimated1RM: derived.e1rm, setVolume: derived.setVolume, restSeconds: prescription.restSeconds };
}

export async function completeWorkout(db: SupabaseClient, userId: string, sessionId: string, input: CompleteInput) {
  const session = await ownedSession(db, userId, sessionId);
  if (!session) return { state: "not_found" as const };
  if (session.status === "completed") return { state: "completed" as const, summary: session.completion_summary, replayed: true };
  const workout = effectiveWorkout(session.original_workout as Workout, session.revised_workout as Workout | null);
  const [{ data: sets }, { data: prs }] = await Promise.all([
    db.from("workout_set_logs").select("id,exercise_slug,set_ordinal,set_type,load_value,load_unit,repetitions,rir,rpe,state,workout_execution_session_id,performed_at").eq("user_id", userId).eq("workout_execution_session_id", sessionId),
    db.from("personal_records").select("id,record_type,value,secondary_value,exercise_slug,unit,status").eq("user_id", userId).eq("workout_execution_session_id", sessionId).eq("status", "active"),
  ]);
  const prescribedSets = workout.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  const intelligenceSets = (sets ?? []).map((set) => ({ id: set.id, exerciseSlug: set.exercise_slug, load: Number(set.load_value ?? 0), unit: set.load_unit, reps: Number(set.repetitions ?? 0), rir: set.rir == null ? null : Number(set.rir), rpe: set.rpe == null ? null : Number(set.rpe), setType: set.set_type, state: set.state, sessionId: set.workout_execution_session_id, performedAt: set.performed_at }));
  const completedWorking = intelligenceSets.filter((set) => set.state === "completed" && set.setType !== "warmup").length;
  if (completedWorking < prescribedSets && !input.allowIncomplete) return { state: "confirmation_required" as const, remainingSets: prescribedSets - completedWorking };
  const completedAt = new Date().toISOString();
  const summary = summarizeWorkoutDeterministically({ startedAt: session.started_at, completedAt, prescribedSets, sets: intelligenceSets, prs: prs ?? [], effort: input.effort as SessionEffort });
  const { error } = await db.from("workout_execution_sessions").update({ status: "completed", completed_at: completedAt, duration_seconds: summary.durationSeconds, session_effort: input.effort, completion_notes: input.note ?? null, completion_summary: summary, completion_summary_version: summary.version, updated_at: completedAt }).eq("id", sessionId).eq("user_id", userId).neq("status", "completed");
  if (error) throw new Error(`WORKOUT_COMPLETE_FAILED:${error.message}`);
  const [workload, achievements] = await Promise.all([persistWeeklyWorkload(db, userId, workout, sets ?? [], completedAt), earnWorkoutAchievements(db, userId, sessionId, completedAt, prs?.length ?? 0)]);
  return { state: "completed" as const, summary, replayed: false, personalRecords: prs ?? [], achievements, workload };
}
