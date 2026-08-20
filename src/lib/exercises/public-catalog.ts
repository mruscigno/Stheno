import { createSupabaseServerClient } from "@/lib/supabase/server";

const releaseGate = {
  status: "production",
  review_status: "reviewed",
  prescribable: true,
  public_indexable: true,
  technical_review_status: "reviewed",
  editorial_review_status: "reviewed",
  visual_review_status: "reviewed",
};

export async function getPublicExercise(slug: string) {
  const db = await createSupabaseServerClient();
  if (!db) return null;
  const { data } = await db.from("exercises").select(
    "slug,name,purpose,movement_pattern,exercise_role,primary_muscles,secondary_muscles,required_equipment,skill_level,rep_min,rep_max,education,caution_tags,media_provenance",
  ).match(releaseGate).eq("slug", slug).maybeSingle();
  return data;
}

export async function getPublicExerciseAlternatives(slug: string, primary: string[]) {
  const db = await createSupabaseServerClient();
  if (!db) return [];
  const { data } = await db.from("exercises")
    .select("slug,name,primary_muscles,exercise_role")
    .match(releaseGate).neq("slug", slug).overlaps("primary_muscles", primary)
    .order("name").limit(30);
  return data ?? [];
}
