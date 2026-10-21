import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { earnWorkoutAchievements, persistWeeklyWorkload, processSetIntelligence } from "@/modules/training-intelligence/server";
import type { Prescription, Workout } from "@/modules/training/types";
import { effectiveWorkout } from "@/modules/workout/logic";

export const WORKOUT_OUTBOX_CONSUMER_VERSION = "app5b1r_v1";

type OutboxEvent = {
  id: string;
  user_id: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown>;
};

function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replaceAll(/[^A-Z0-9_:.-]/gi, "_").slice(0, 120) || "UNKNOWN";
}

function isPermanent(error: unknown) {
  const value = errorCode(error);
  return ["OUTBOX_SESSION_MISSING", "OUTBOX_SET_MISSING", "OUTBOX_PRESCRIPTION_MISSING", "OUTBOX_EVENT_UNSUPPORTED"].some(code => value.includes(code));
}

async function consumeSet(db: SupabaseClient, event: OutboxEvent) {
  const [{ data: set }, { data: session }] = await Promise.all([
    db.from("workout_set_logs").select("*").eq("id", String((event.payload.set as { id?: unknown } | undefined)?.id ?? "")).eq("user_id", event.user_id).maybeSingle(),
    db.from("workout_execution_sessions").select("original_workout,revised_workout").eq("id", event.session_id).eq("user_id", event.user_id).maybeSingle(),
  ]);
  if (!set) throw new Error("OUTBOX_SET_MISSING");
  if (!session) throw new Error("OUTBOX_SESSION_MISSING");
  const workout = effectiveWorkout(session.original_workout as Workout, session.revised_workout as Workout | null);
  const prescription = workout.exercises.find(item => item.exerciseSlug === set.exercise_slug) as Prescription | undefined;
  if (!prescription) throw new Error("OUTBOX_PRESCRIPTION_MISSING");
  await processSetIntelligence(db, event.user_id, event.session_id, set, prescription, set.recommendation_id ?? null);
}

async function consumeCompletion(db: SupabaseClient, event: OutboxEvent) {
  const [{ data: session }, { data: sets }, { count: prCount }] = await Promise.all([
    db.from("workout_execution_sessions").select("original_workout,revised_workout,completed_at").eq("id", event.session_id).eq("user_id", event.user_id).maybeSingle(),
    db.from("workout_set_logs").select("id,exercise_slug,load_value,load_unit,repetitions,rir,rpe,set_type,state,workout_execution_session_id,performed_at").eq("user_id", event.user_id).eq("workout_execution_session_id", event.session_id).is("deleted_at", null),
    db.from("personal_records").select("id", { count: "exact", head: true }).eq("user_id", event.user_id).eq("workout_execution_session_id", event.session_id).eq("status", "active"),
  ]);
  if (!session) throw new Error("OUTBOX_SESSION_MISSING");
  const workout = effectiveWorkout(session.original_workout as Workout, session.revised_workout as Workout | null);
  const completedAt = session.completed_at ?? new Date().toISOString();
  await persistWeeklyWorkload(db, event.user_id, workout, sets ?? [], completedAt);
  await earnWorkoutAchievements(db, event.user_id, event.session_id, completedAt, prCount ?? 0);
}

async function consumeDelete(db: SupabaseClient, event: OutboxEvent) {
  const setId = String(event.payload.setId ?? "");
  if (!setId) throw new Error("OUTBOX_SET_MISSING");
  const [metrics, records] = await Promise.all([
    db.from("exercise_performance_metrics").delete().eq("user_id", event.user_id).eq("source_set_id", setId),
    db.from("personal_records").update({ status: "invalidated" }).eq("user_id", event.user_id).eq("source_set_id", setId),
  ]);
  if (metrics.error) throw new Error(`OUTBOX_METRIC_DELETE_FAILED:${metrics.error.message}`);
  if (records.error) throw new Error(`OUTBOX_RECORD_INVALIDATE_FAILED:${records.error.message}`);
}

async function consumeWorkoutEvent(db: SupabaseClient, event: OutboxEvent) {
  switch (event.event_type) {
    case "workout.upsert_set": return consumeSet(db, event);
    case "workout.delete_set": return consumeDelete(db, event);
    case "workout.complete_session": return consumeCompletion(db, event);
    case "workout.start_session":
    case "workout.save_note":
    case "workout.substitute_exercise":
    case "workout.adapt_session": return;
    default: throw new Error(`OUTBOX_EVENT_UNSUPPORTED:${event.event_type}`);
  }
}

export async function drainWorkoutOutbox(db: SupabaseClient, options: { batchSize?: number; leaseSeconds?: number; timeBudgetMs?: number } = {}) {
  const workerId = crypto.randomUUID();
  const started = Date.now();
  const batchSize = Math.min(50, Math.max(1, options.batchSize ?? 20));
  const { data, error } = await db.rpc("claim_workout_outbox", { p_worker_id: workerId, p_batch_size: batchSize, p_lease_seconds: options.leaseSeconds ?? 120 });
  if (error) throw new Error(`OUTBOX_CLAIM_FAILED:${error.message}`);
  const result = { workerId, claimed: (data ?? []).length, processed: 0, retried: 0, deadLettered: 0, leaseLost: 0 };
  for (const raw of data ?? []) {
    if (Date.now() - started > (options.timeBudgetMs ?? 240_000)) break;
    const event = raw as OutboxEvent;
    try {
      await consumeWorkoutEvent(db, event);
      const ack = await db.rpc("ack_workout_outbox", { p_event_id: event.id, p_worker_id: workerId, p_consumer_version: WORKOUT_OUTBOX_CONSUMER_VERSION });
      if (ack.error) throw new Error(`OUTBOX_ACK_FAILED:${ack.error.message}`);
      if (ack.data) result.processed++;
      else result.leaseLost++;
    } catch (failure) {
      const failed = await db.rpc("fail_workout_outbox", { p_event_id: event.id, p_worker_id: workerId, p_error_code: errorCode(failure), p_permanent: isPermanent(failure) });
      if (failed.error) throw new Error(`OUTBOX_FAILURE_RECORD_FAILED:${failed.error.message}`);
      if (failed.data === "dead_letter") result.deadLettered++;
      else if (failed.data === "pending") result.retried++;
      else result.leaseLost++;
    }
  }
  return result;
}
