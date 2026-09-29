import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeExerciseGuide } from "@/modules/training/guide-content";
import { getPublicExerciseAlternatives } from "@/lib/exercises/public-catalog";
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
      "id,slug,name,family,exercise_type,movement_type,prescription_unit,movement_pattern,exercise_role,primary_muscles,secondary_muscles,required_equipment,education,caution_tags,fatigue_cost,rep_min,rep_max,duration_min_seconds,duration_max_seconds,distance_min,distance_max,distance_unit,interval_work_seconds,interval_recovery_seconds,interval_rounds_min,interval_rounds_max",
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
  const alternatives=(await getPublicExerciseAlternatives(data.id)).map(candidate=>candidate.slug);
  return NextResponse.json({exercise:{...data,education:completeExerciseGuide({name:data.name,movementPattern:data.movement_pattern,primaryMuscles:data.primary_muscles,equipment:data.required_equipment,education:data.education})},alternatives});
}
