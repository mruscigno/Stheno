import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prescription, Workout } from "@/modules/training/types";
import { productionExerciseLibrary } from "@/modules/training/exercises";
import {
  ADAPTIVE_LOAD_VERSION,
  E1RM_VERSION,
  PR_VERSION,
  WORKLOAD_VERSION,
  calculateEstimated1RM,
  calculateMuscleContributions,
  calculateSetVolume,
  evaluatePersonalRecords,
  recommendLoad,
  type ExerciseIntelligenceMetadata,
  type IntelligenceSet,
  type LoadUnit,
  type SessionEffort,
} from ".";

type ExerciseRow = { slug: string; primary_muscles?: string[] | null; secondary_muscles?: string[] | null; required_equipment?: string[] | null; exercise_type?: string | null; progression_suitability?: number | null };
type SetRow = { id?: string; exercise_slug: string; load_value: number | string | null; load_unit?: LoadUnit | null; repetitions: number | null; rir?: number | string | null; rpe?: number | string | null; set_type?: IntelligenceSet["setType"] | null; state: "completed" | "skipped"; workout_execution_session_id?: string; performed_at?: string };

export function metadataFromRow(slug: string, row?: ExerciseRow | null): ExerciseIntelligenceMetadata {
  const fallback = productionExerciseLibrary.find(exercise => exercise.slug === slug);
  const equipment = row?.required_equipment ?? fallback?.requiredEquipment ?? [];
  return {
    exerciseSlug: slug,
    primaryMuscles: row?.primary_muscles ?? fallback?.primaryMuscles ?? [],
    secondaryMuscles: row?.secondary_muscles ?? fallback?.secondaryMuscles ?? [],
    equipment,
    bodyweightOnly: equipment.length === 1 && equipment[0] === "bodyweight",
    e1rmEligible: row?.exercise_type !== "timed" && !(equipment.length === 1 && equipment[0] === "bodyweight"),
    volumeComparable: row?.exercise_type !== "timed" && !(equipment.length === 1 && equipment[0] === "bodyweight"),
    increment: equipment.includes("dumbbells") || equipment.includes("barbell") ? 5 : 5,
  };
}

export function intelligenceSet(row: SetRow): IntelligenceSet {
  return {
    id: row.id,
    exerciseSlug: row.exercise_slug,
    load: Number(row.load_value ?? 0),
    unit: row.load_unit ?? "lb",
    reps: Number(row.repetitions ?? 0),
    rir: row.rir == null ? null : Number(row.rir),
    rpe: row.rpe == null ? null : Number(row.rpe),
    setType: row.set_type ?? "working",
    state: row.state,
    sessionId: row.workout_execution_session_id,
    performedAt: row.performed_at,
  };
}

export async function loadExerciseMetadata(db: SupabaseClient, slugs: string[]) {
  const { data } = await db.from("exercises").select("slug,primary_muscles,secondary_muscles,required_equipment,exercise_type,progression_suitability").in("slug", slugs);
  const rows = new Map((data ?? []).map(row => [row.slug, row as ExerciseRow]));
  return new Map(slugs.map(slug => [slug, metadataFromRow(slug, rows.get(slug))]));
}

export async function buildWorkoutIntelligence(db: SupabaseClient, userId: string, sessionId: string, workout: Workout, programPrescriptionId: string) {
  const slugs = workout.exercises.map(exercise => exercise.exerciseSlug);
  const [metadata, historyResult] = await Promise.all([
    loadExerciseMetadata(db, slugs),
    db.from("workout_set_logs").select("id,exercise_slug,load_value,load_unit,repetitions,rir,rpe,set_type,state,workout_execution_session_id,performed_at").eq("user_id", userId).in("exercise_slug", slugs).neq("workout_execution_session_id", sessionId).eq("state", "completed").order("performed_at", { ascending: false }).limit(240),
  ]);
  const history = (historyResult.data ?? []).map(row => intelligenceSet(row as SetRow));
  const previous: Record<string, IntelligenceSet[]> = {};
  const recommendations = [];
  for (const exercise of workout.exercises) {
    const comparable = history.filter(set => set.exerciseSlug === exercise.exerciseSlug);
    const latestSession = comparable[0]?.sessionId;
    previous[exercise.exerciseSlug] = comparable.filter(set => set.sessionId === latestSession).slice(0, exercise.sets);
    const recommendation = recommendLoad({
      prescription: { repMin: exercise.repMin, repMax: exercise.repMax, targetRir: exercise.rir, requiredSets: exercise.sets, currentLoad: comparable[0]?.load, unit: comparable[0]?.unit ?? "lb" },
      recentSets: comparable,
      metadata: metadata.get(exercise.exerciseSlug)!,
    });
    const rows = Array.from({ length: exercise.sets }, (_, index) => ({
      user_id: userId,
      program_prescription_id: programPrescriptionId,
      workout_execution_session_id: sessionId,
      exercise_slug: exercise.exerciseSlug,
      set_ordinal: index + 1,
      recommended_load: recommendation.load,
      load_unit: recommendation.unit,
      recommended_reps_min: recommendation.repsMin,
      recommended_reps_max: recommendation.repsMax,
      confidence: recommendation.confidence,
      reason_code: recommendation.reasonCode,
      algorithm_version: ADAPTIVE_LOAD_VERSION,
      evidence_snapshot: recommendation.evidence,
    }));
    const saved = await db.from("training_load_recommendations").upsert(rows, { onConflict: "user_id,workout_execution_session_id,exercise_slug,set_ordinal,algorithm_version" }).select("id,exercise_slug,set_ordinal,recommended_load,load_unit,recommended_reps_min,recommended_reps_max,confidence,reason_code,algorithm_version");
    recommendations.push(...(saved.data ?? []).map(row => ({ ...row, explanation: recommendation.explanation })));
  }
  return { previous, recommendations };
}

export async function processSetIntelligence(db: SupabaseClient, userId: string, sessionId: string, savedSet: SetRow, prescription: Prescription, recommendationId?: string | null) {
  const metadata = (await loadExerciseMetadata(db, [savedSet.exercise_slug])).get(savedSet.exercise_slug)!;
  const { data: historyRows } = await db.from("workout_set_logs").select("id,exercise_slug,load_value,load_unit,repetitions,rir,rpe,set_type,state,workout_execution_session_id,performed_at").eq("user_id", userId).eq("exercise_slug", savedSet.exercise_slug).neq("id", savedSet.id!).is("invalidated_at", null);
  const candidate = intelligenceSet(savedSet);
  const history = (historyRows ?? []).map(row => intelligenceSet(row as SetRow));
  const e1rm = calculateEstimated1RM({ load: candidate.load, reps: candidate.reps, eligible: metadata.e1rmEligible });
  const volume = calculateSetVolume(candidate, metadata.volumeComparable);
  await db.from("exercise_performance_metrics").upsert({ user_id: userId, exercise_slug: candidate.exerciseSlug, workout_execution_session_id: sessionId, source_set_id: savedSet.id, estimated_1rm: e1rm.value, e1rm_formula: e1rm.formula, e1rm_version: E1RM_VERSION, set_volume: volume.value, volume_scope: volume.scope, updated_at: new Date().toISOString() }, { onConflict: "source_set_id,e1rm_version" });
  await db.from("personal_records").update({ status: "invalidated" }).eq("user_id", userId).eq("source_set_id", savedSet.id!);
  const candidates = evaluatePersonalRecords(history, candidate, metadata);
  if (candidates.length) await db.from("personal_records").upsert(candidates.map(pr => ({ user_id: userId, workout_execution_session_id: sessionId, exercise_slug: candidate.exerciseSlug, record_type: pr.type, value: pr.value, secondary_value: pr.secondaryValue, unit: candidate.unit, source_set_id: savedSet.id, context: { load: candidate.load, reps: candidate.reps, set_type: candidate.setType }, achieved_at: savedSet.performed_at ?? new Date().toISOString(), engine_version: PR_VERSION, ruleset_version: PR_VERSION, algorithm_version: PR_VERSION, status: "active" })), { onConflict: "user_id,exercise_slug,record_type,source_set_id,algorithm_version" });
  if (recommendationId) await db.from("training_load_recommendations").update({ accepted_at: candidate.load === Number((await db.from("training_load_recommendations").select("recommended_load").eq("id", recommendationId).eq("user_id", userId).maybeSingle()).data?.recommended_load) ? new Date().toISOString() : null, performed_set_id: savedSet.id }).eq("id", recommendationId).eq("user_id", userId);
  return { personalRecords: candidates, e1rm: e1rm.value, setVolume: volume.value, prescribed: { repMin: prescription.repMin, repMax: prescription.repMax } };
}

export async function persistWeeklyWorkload(db: SupabaseClient, userId: string, workout: Workout, sets: SetRow[], completedAt: string) {
  const slugs = workout.exercises.map(exercise => exercise.exerciseSlug);
  const metadata = await loadExerciseMetadata(db, slugs);
  const date = new Date(completedAt), day = date.getUTCDay(), monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((day + 6) % 7))).toISOString().slice(0, 10);
  const muscles = new Map<string, { planned: number; completed: number }>();
  for (const exercise of workout.exercises) {
    const info = metadata.get(exercise.exerciseSlug)!;
    const plannedSets = Array.from({ length: exercise.sets }, () => ({ exerciseSlug: exercise.exerciseSlug, load: 0, unit: "lb" as const, reps: exercise.repMin, setType: "working" as const, state: "completed" as const }));
    const planned = calculateMuscleContributions(info, plannedSets).contributions;
    const completed = calculateMuscleContributions(info, sets.filter(set => set.exercise_slug === exercise.exerciseSlug).map(set => intelligenceSet(set))).contributions;
    for (const muscle of new Set([...Object.keys(planned), ...Object.keys(completed)])) {
      const value = muscles.get(muscle) ?? { planned: 0, completed: 0 };
      value.planned += planned[muscle] ?? 0; value.completed += completed[muscle] ?? 0; muscles.set(muscle, value);
    }
  }
  const { data: existing } = await db.from("muscle_workload_weekly").select("muscle_group,planned_set_equivalents,completed_set_equivalents").eq("user_id", userId).eq("period_start", monday).eq("algorithm_version", WORKLOAD_VERSION);
  const prior = new Map((existing ?? []).map(row => [row.muscle_group, { planned: Number(row.planned_set_equivalents), completed: Number(row.completed_set_equivalents) }]));
  if (muscles.size) await db.from("muscle_workload_weekly").upsert([...muscles].map(([muscle, value]) => ({ user_id: userId, period_start: monday, muscle_group: muscle, planned_set_equivalents: value.planned + (prior.get(muscle)?.planned ?? 0), completed_set_equivalents: value.completed + (prior.get(muscle)?.completed ?? 0), algorithm_version: WORKLOAD_VERSION, updated_at: completedAt })), { onConflict: "user_id,period_start,muscle_group,algorithm_version" });
  return Object.fromEntries(muscles);
}

export async function earnWorkoutAchievements(db: SupabaseClient, userId: string, sessionId: string, completedAt: string, prCount: number) {
  const { count } = await db.from("workout_execution_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed");
  const total = count ?? 0;
  const types = [total === 1 ? "first_workout" : null, [5, 10, 25, 50].includes(total) ? `${total}_workouts` : null, prCount > 0 ? "first_strength_pr" : null].filter((value): value is string => Boolean(value));
  if (types.length) await db.from("training_achievements").upsert(types.map(type => ({ user_id: userId, achievement_type: type, source_session_id: sessionId, achieved_at: completedAt, context: { completed_workouts: total }, algorithm_version: PR_VERSION })), { onConflict: "user_id,achievement_type,source_session_id,algorithm_version", ignoreDuplicates: true });
  return types;
}

export function effortForRecommendation(effort?: SessionEffort | null) { return effort ?? null; }
