import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalExerciseSelect, getCanonicalExercise } from "@/lib/exercises/canonical";

const releaseGate = { status: "production", review_status: "reviewed", production_ready: true, technical_review_status: "reviewed", editorial_review_status: "reviewed", visual_review_status: "reviewed" };

export async function listExercises(db: SupabaseClient, input: { cursor?: string; limit: number; query?: string; equipment?: string; muscle?: string; pattern?: string }) {
  let query = db.from("exercises").select(canonicalExerciseSelect).match(releaseGate).order("slug").limit(input.limit + 1);
  if (input.cursor) query = query.gt("slug", input.cursor);
  if (input.query) query = query.or(`name.ilike.%${input.query.replaceAll(/[,%()]/g, "")}%,slug.ilike.%${input.query.replaceAll(/[,%()]/g, "")}%`);
  if (input.equipment) query = query.contains("required_equipment", [input.equipment]);
  if (input.muscle) query = query.contains("primary_muscles", [input.muscle]);
  if (input.pattern) query = query.eq("movement_pattern", input.pattern);
  const { data, error } = await query;
  if (error) throw new Error(`EXERCISE_LIST_FAILED:${error.message}`);
  const rows = data ?? [];
  const hasMore = rows.length > input.limit;
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: hasMore ? items.at(-1)?.slug ?? null : null };
}

export async function exerciseDetail(db: SupabaseClient, slug: string) {
  const exercise = await getCanonicalExercise(slug, db);
  if (!exercise) return null;
  const { data: edges, error } = await db.from("exercise_alternatives").select("alternative_id,rank").eq("exercise_id", exercise.id).eq("review_status", "reviewed").order("rank").limit(6);
  if (error) throw new Error(`EXERCISE_ALTERNATIVES_FAILED:${error.message}`);
  if (!edges?.length) return { exercise, alternatives: [] };
  const rank = new Map(edges.map((edge) => [edge.alternative_id, edge.rank]));
  const { data } = await db.from("exercises").select("id,slug,name,primary_muscles,exercise_role").in("id", edges.map((edge) => edge.alternative_id)).match(releaseGate).eq("prescribable", true);
  return { exercise, alternatives: (data ?? []).sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99)) };
}
