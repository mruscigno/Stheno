import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ranges: Record<string, number | null> = { "4w": 28, "8w": 56, "3m": 90, "6m": 182, "1y": 365, all: null };

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url), range = ranges[url.searchParams.get("range") ?? "8w"] === undefined ? "8w" : (url.searchParams.get("range") ?? "8w"), days = ranges[range];
  const since = days == null ? null : new Date(Date.now() - days * 86400000).toISOString();
  let sessionsQuery = supabase.from("workout_execution_sessions").select("id,workout_key,status,original_workout,started_at,completed_at,duration_seconds,session_effort,completion_summary").eq("user_id", user.id).order("started_at", { ascending: true });
  if (since) sessionsQuery = sessionsQuery.gte("started_at", since);
  const sessionsResult = await sessionsQuery;
  const sessionIds = (sessionsResult.data ?? []).map(session => session.id);
  if (!sessionIds.length) return NextResponse.json({ range, status: "Complete your first workout to start a real progress record.", metrics: { workoutsCompleted: 0, workoutAdherence: null, setAdherence: null, prCount: 0, totalVolume: 0 }, frequency: [], exercises: [], prs: [], workload: [], achievements: [] });
  const [setsResult, metricsResult, prsResult, workloadResult, achievementsResult] = await Promise.all([
    supabase.from("workout_set_logs").select("id,workout_execution_session_id,exercise_slug,set_type,load_value,load_unit,repetitions,rir,rpe,state,performed_at").eq("user_id", user.id).in("workout_execution_session_id", sessionIds).order("performed_at", { ascending: true }),
    supabase.from("exercise_performance_metrics").select("exercise_slug,workout_execution_session_id,source_set_id,estimated_1rm,set_volume,created_at").eq("user_id", user.id).in("workout_execution_session_id", sessionIds).order("created_at", { ascending: true }),
    supabase.from("personal_records").select("id,exercise_slug,record_type,value,secondary_value,unit,achieved_at,status,source_set_id").eq("user_id", user.id).in("workout_execution_session_id", sessionIds).eq("status", "active").order("achieved_at", { ascending: false }),
    (() => { let query = supabase.from("muscle_workload_weekly").select("period_start,muscle_group,planned_set_equivalents,completed_set_equivalents,algorithm_version").eq("user_id", user.id).order("period_start", { ascending: true }); if (since) query = query.gte("period_start", since.slice(0, 10)); return query; })(),
    supabase.from("training_achievements").select("id,achievement_type,achieved_at,context").eq("user_id", user.id).order("achieved_at", { ascending: false }).limit(25),
  ]);
  const sessions = sessionsResult.data ?? [], completedSessions = sessions.filter(session => session.status === "completed"), sets = setsResult.data ?? [], completedSets = sets.filter(set => set.state === "completed" && set.set_type !== "warmup");
  const plannedSets = sessions.reduce((total, session) => total + (((session.original_workout as { exercises?: { sets?: number }[] })?.exercises ?? []).reduce((sum, exercise) => sum + Number(exercise.sets ?? 0), 0)), 0);
  const scheduled = sessions.filter(session => session.status !== "abandoned").length;
  const exerciseNames = new Map<string, string>();
  for (const session of sessions) for (const exercise of ((session.original_workout as { exercises?: { exerciseSlug: string; exerciseName: string }[] })?.exercises ?? [])) exerciseNames.set(exercise.exerciseSlug, exercise.exerciseName);
  const exerciseGroups = new Map<string, typeof completedSets>();
  for (const set of completedSets) exerciseGroups.set(set.exercise_slug, [...(exerciseGroups.get(set.exercise_slug) ?? []), set]);
  const exercises = [...exerciseGroups].map(([slug, exerciseSets]) => {
    const observations = (metricsResult.data ?? []).filter(metric => metric.exercise_slug === slug), e1rm = observations.map(metric => Number(metric.estimated_1rm ?? 0)).filter(Boolean), volumes = observations.map(metric => Number(metric.set_volume ?? 0)).filter(Boolean);
    return { slug, name: exerciseNames.get(slug) ?? slug.replaceAll("-", " "), sessions: new Set(exerciseSets.map(set => set.workout_execution_session_id)).size, bestLoad: Math.max(0, ...exerciseSets.map(set => Number(set.load_value ?? 0))), bestReps: Math.max(0, ...exerciseSets.map(set => Number(set.repetitions ?? 0))), currentE1rm: e1rm.at(-1) ?? null, bestE1rm: e1rm.length ? Math.max(...e1rm) : null, totalVolume: volumes.reduce((sum, value) => sum + value, 0), timeline: observations.map(metric => ({ date: metric.created_at, e1rm: metric.estimated_1rm == null ? null : Number(metric.estimated_1rm), volume: metric.set_volume == null ? null : Number(metric.set_volume) })) };
  }).sort((a, b) => b.sessions - a.sessions);
  const firstBest = exercises[0], strengthChange = firstBest?.timeline.length && firstBest.timeline[0].e1rm && firstBest.timeline.at(-1)?.e1rm ? ((Number(firstBest.timeline.at(-1)!.e1rm) - Number(firstBest.timeline[0].e1rm)) / Number(firstBest.timeline[0].e1rm)) * 100 : null;
  const status = completedSessions.length < 2 ? "Keep logging workouts to reveal a reliable trend." : strengthChange != null && strengthChange >= 2 ? `You're getting stronger. ${firstBest.name} is trending up.` : `You've completed ${completedSessions.length} workouts in this range. Your current strength trend is steady.`;
  const frequencyMap = new Map<string, number>(); for (const session of completedSessions) { const week = session.completed_at?.slice(0, 10) ?? session.started_at.slice(0, 10); frequencyMap.set(week, (frequencyMap.get(week) ?? 0) + 1); }
  const workload = [...new Set((workloadResult.data ?? []).map(row => row.muscle_group))].map(muscle => { const rows = (workloadResult.data ?? []).filter(row => row.muscle_group === muscle); return { muscle, planned: rows.reduce((sum, row) => sum + Number(row.planned_set_equivalents), 0), completed: rows.reduce((sum, row) => sum + Number(row.completed_set_equivalents), 0) }; }).sort((a, b) => b.completed - a.completed);
  return NextResponse.json({ range, status, metrics: { workoutsCompleted: completedSessions.length, workoutAdherence: scheduled ? Math.round(completedSessions.length / scheduled * 100) : null, setAdherence: plannedSets ? Math.round(completedSets.length / plannedSets * 100) : null, prCount: (prsResult.data ?? []).length, totalVolume: (metricsResult.data ?? []).reduce((sum, metric) => sum + Number(metric.set_volume ?? 0), 0), strengthChangePercent: strengthChange }, frequency: [...frequencyMap].map(([date, count]) => ({ date, count })), exercises, prs: prsResult.data ?? [], workload, achievements: achievementsResult.data ?? [] });
}
