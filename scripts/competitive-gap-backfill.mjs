import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required. Run with node --env-file=.env.local.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: rows, error } = await db.from("workout_set_logs").select("id,user_id,workout_execution_session_id,exercise_slug,set_type,load_value,load_unit,repetitions,state,performed_at").order("performed_at", { ascending: true });
if (error) throw error;
const sessions = new Set(rows.map(row => row.workout_execution_session_id));
const valid = rows.filter(row => row.state === "completed" && row.set_type !== "warmup" && Number(row.load_value) > 0 && Number(row.repetitions) >= 1 && Number(row.repetitions) <= 12);
const summary = { mode: apply ? "apply" : "dry-run", sessionsScanned: sessions.size, setsScanned: rows.length, validSets: valid.length, skipped: { notCompleted: rows.filter(row => row.state !== "completed").length, warmup: rows.filter(row => row.set_type === "warmup").length, invalidOrIneligibleLoadReps: rows.filter(row => row.state === "completed" && row.set_type !== "warmup" && !(Number(row.load_value) > 0 && Number(row.repetitions) >= 1 && Number(row.repetitions) <= 12)).length }, metricRows: valid.length };
if (!apply) { console.log(JSON.stringify(summary, null, 2)); process.exit(0); }
for (let offset = 0; offset < valid.length; offset += 250) {
  const batch = valid.slice(offset, offset + 250).map(row => ({ user_id: row.user_id, exercise_slug: row.exercise_slug, workout_execution_session_id: row.workout_execution_session_id, source_set_id: row.id, estimated_1rm: Number(row.load_value) * (1 + Number(row.repetitions) / 30), e1rm_formula: "epley", e1rm_version: "epley_v1", set_volume: Number(row.load_value) * Number(row.repetitions), volume_scope: "within_exercise", created_at: row.performed_at, updated_at: new Date().toISOString() }));
  const result = await db.from("exercise_performance_metrics").upsert(batch, { onConflict: "source_set_id,e1rm_version" });
  if (result.error) throw result.error;
}
console.log(JSON.stringify({ ...summary, applied: valid.length }, null, 2));
