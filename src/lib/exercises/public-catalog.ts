import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCanonicalExercise } from "@/lib/exercises/canonical";

const releaseGate = {
  status: "production",
  review_status: "reviewed",
  public_indexable: true,
  technical_review_status: "reviewed",
  editorial_review_status: "reviewed",
  visual_review_status: "reviewed",
  production_ready: true,
};

export async function getPublicExercise(slug: string) {
  return getCanonicalExercise(slug);
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
