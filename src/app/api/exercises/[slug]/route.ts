import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCanonicalExercise } from "@/lib/exercises/canonical";
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
  const data = await getCanonicalExercise(slug, supabase);
  if (!data) return NextResponse.json(
        { error: "Exercise guidance is unavailable" },
        { status: 404 },
      );
  const alternatives=(await getPublicExerciseAlternatives(data.id)).map(candidate=>candidate.slug);
  return NextResponse.json({exercise:data,alternatives});
}
