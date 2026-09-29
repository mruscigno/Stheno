import { createSupabaseServerClient } from "@/lib/supabase/server";

const releaseGate = {
  status: "production",
  review_status: "reviewed",
  public_indexable: true,
  technical_review_status: "reviewed",
  editorial_review_status: "reviewed",
  visual_review_status: "reviewed",
};

export async function getPublicExercise(slug: string) {
  const db = await createSupabaseServerClient();
  if (!db) return null;
  const { data } = await db.from("exercises").select(
    "id,slug,name,purpose,exercise_type,movement_type,prescription_unit,movement_pattern,exercise_role,primary_muscles,secondary_muscles,required_equipment,skill_level,rep_min,rep_max,duration_min_seconds,duration_max_seconds,distance_min,distance_max,distance_unit,interval_work_seconds,interval_recovery_seconds,interval_rounds_min,interval_rounds_max,education,caution_tags,media_provenance",
  ).match(releaseGate).eq("slug", slug).maybeSingle();
  return data;
}

export async function getPublicExerciseAlternatives(exerciseId: string) {
  const db = await createSupabaseServerClient();
  if (!db) return [];
  const {data:edges}=await db.from("exercise_alternatives").select("alternative_id,rank").eq("exercise_id",exerciseId).eq("review_status","reviewed").order("rank").limit(6);
  if(!edges?.length)return [];
  const ids=edges.map(edge=>edge.alternative_id),rank=new Map(edges.map(edge=>[edge.alternative_id,edge.rank]));
  const {data}=await db.from("exercises").select("id,slug,name,primary_muscles,exercise_role").in("id",ids).match(releaseGate).eq("prescribable",true);
  return (data??[]).sort((a,b)=>(rank.get(a.id)??99)-(rank.get(b.id)??99));
}
