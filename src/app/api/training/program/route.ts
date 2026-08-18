import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateProgram } from "@/modules/training/generate";
import { profileSnapshotToTrainingProfile } from "@/modules/training/profile-adapter";
import { validateProgram } from "@/modules/training/validate";
async function authenticated() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}
export async function GET() {
  const ctx = await authenticated();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await ctx.supabase
    .from("program_prescriptions")
    .select(
      "id,program_id,prescription,validation_result,engine_version,ruleset_version,prescribed_at",
    )
    .eq("user_id", ctx.user.id)
    .order("prescribed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Unable to load program" },
      { status: 500 },
    );
  return NextResponse.json({ program: data });
}
export async function POST() {
  const ctx = await authenticated();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: snapshot, error: snapshotError } = await ctx.supabase
    .from("personalization_profile_snapshots")
    .select("id,assessment_id,safety_classification,profile")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (snapshotError || !snapshot)
    return NextResponse.json(
      { error: "Complete the assessment before generating a program" },
      { status: 409 },
    );
  try {
    const profile = profileSnapshotToTrainingProfile(snapshot);
    let generated = generateProgram(profile);
    const { data: preferences } = await ctx.supabase
      .from("exercise_replacement_preferences")
      .select("original_slug,replacement_slug")
      .eq("user_id", ctx.user.id);
    if (preferences?.length) {
      const replacements = new Map(
        preferences.map((item) => [item.original_slug, item.replacement_slug]),
      );
      generated = {
        ...generated,
        workouts: generated.workouts.map((workout) => ({
          ...workout,
          exercises: workout.exercises.map((exercise) => {
            const replacement = replacements.get(exercise.exerciseSlug);
            return replacement && exercise.alternatives.includes(replacement)
              ? {
                  ...exercise,
                  exerciseSlug: replacement,
                  exerciseName: replacement.replaceAll("-", " "),
                }
              : exercise;
          }),
        })),
      };
    }
    const validation = validateProgram(generated, profile);
    if (!validation.valid)
      return NextResponse.json(
        { error: "Program validation failed", validation },
        { status: 422 },
      );
    const { data: program, error: programError } = await ctx.supabase
      .from("programs")
      .insert({
        user_id: ctx.user.id,
        name: generated.name,
        engine_version: generated.engineVersion,
        ruleset_version: generated.rulesetVersion,
      })
      .select("id")
      .single();
    if (programError)
      return NextResponse.json(
        { error: "Unable to persist program" },
        { status: 500 },
      );
    const { data: prescription, error } = await ctx.supabase
      .from("program_prescriptions")
      .insert({
        user_id: ctx.user.id,
        program_id: program.id,
        profile_snapshot_id: snapshot.id,
        assessment_id: snapshot.assessment_id,
        prescription: generated,
        validation_result: validation,
        engine_version: generated.engineVersion,
        ruleset_version: generated.rulesetVersion,
      })
      .select("id,prescribed_at")
      .single();
    if (error) {
      await ctx.supabase
        .from("programs")
        .delete()
        .eq("id", program.id)
        .eq("user_id", ctx.user.id);
      return NextResponse.json(
        { error: "Unable to persist prescription" },
        { status: 500 },
      );
    }
    const retiredAt = new Date().toISOString();
    await Promise.all([
      ctx.supabase
        .from("programs")
        .update({ retired_at: retiredAt })
        .eq("user_id", ctx.user.id)
        .is("retired_at", null)
        .neq("id", program.id),
      ctx.supabase
        .from("coach_decisions")
        .insert({
          user_id: ctx.user.id,
          decision_type: "training",
          reason_code: "PROGRAM_GENERATED",
          new_state: {
            program_id: program.id,
            prescription_id: prescription.id,
          },
          structured_inputs: {
            profile_snapshot_id: snapshot.id,
            assessment_id: snapshot.assessment_id,
          },
          engine_version: generated.engineVersion,
          ruleset_version: generated.rulesetVersion,
        }),
    ]);
    return NextResponse.json(
      {
        programId: program.id,
        prescriptionId: prescription.id,
        program: generated,
        validation,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PROGRAM_GENERATION_FAILED";
    const status = message.includes("SAFETY") ? 409 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
