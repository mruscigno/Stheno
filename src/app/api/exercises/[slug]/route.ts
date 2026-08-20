import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeExerciseGuide } from "@/modules/training/guide-content";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const { data } = await supabase
    .from("exercises")
    .select(
      "slug,name,family,movement_pattern,exercise_role,primary_muscles,secondary_muscles,required_equipment,education,caution_tags,fatigue_cost,rep_min,rep_max",
    )
    .eq("slug", slug)
    .eq("status", "production")
    .eq("review_status", "reviewed")
    .eq("prescribable", true)
    .eq("technical_review_status", "reviewed")
    .eq("editorial_review_status", "reviewed")
    .eq("visual_review_status", "reviewed")
    .single();
  if (!data) return NextResponse.json(
        { error: "Exercise guidance is unavailable" },
        { status: 404 },
      );
  const {data:candidates}=await supabase.from("exercises").select("slug,name,movement_pattern,exercise_role,primary_muscles,required_equipment,fatigue_cost,rep_min,rep_max").eq("status","production").eq("review_status","reviewed").eq("prescribable",true).eq("technical_review_status","reviewed").eq("editorial_review_status","reviewed").eq("visual_review_status","reviewed").neq("slug",data.slug).overlaps("primary_muscles",data.primary_muscles).order("slug").limit(500);
  const alternatives=(candidates??[]).filter(candidate=>candidate.primary_muscles.some((muscle:string)=>data.primary_muscles.includes(muscle))&&candidate.exercise_role===data.exercise_role).map(candidate=>{const primaryOverlap=candidate.primary_muscles.filter((muscle:string)=>data.primary_muscles.includes(muscle)).length/data.primary_muscles.length,pattern=candidate.movement_pattern===data.movement_pattern?1:0,equipment=candidate.required_equipment.filter((item:string)=>data.required_equipment.includes(item)).length/Math.max(1,candidate.required_equipment.length),fatigue=1-Math.abs(Number(candidate.fatigue_cost)-Number(data.fatigue_cost))/4,reps=1-Math.min(1,Math.abs(Number(candidate.rep_min)-Number(data.rep_min))/10);return{...candidate,score:primaryOverlap*40+pattern*25+equipment*15+fatigue*10+reps*10}}).sort((a,b)=>b.score-a.score||a.slug.localeCompare(b.slug)).slice(0,6).map(candidate=>candidate.slug);
  return NextResponse.json({exercise:{...data,education:completeExerciseGuide({name:data.name,movementPattern:data.movement_pattern,primaryMuscles:data.primary_muscles,equipment:data.required_equipment,education:data.education})},alternatives});
}
