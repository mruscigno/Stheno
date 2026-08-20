import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  feedback: z.string().trim().min(10).max(4000),
  consistencyHelped: z.boolean().optional(),
  travelAdaptationUsed: z.boolean(),
  scheduleAdaptationUsed: z.boolean(),
  equipmentSubstitutionUsed: z.boolean(),
  decisionFatigueReduced: z.boolean().optional(),
  permissionToQuote: z.boolean(),
  permissionForCaseStudy: z.boolean(),
  permissionForOutcomeMetrics: z.boolean(),
});

export async function POST(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (!db || !user) return NextResponse.json({ error: "Sign in to share feedback." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please add at least a short description of your experience." }, { status: 400 });
  const input = parsed.data;
  const consentGiven = input.permissionToQuote || input.permissionForCaseStudy || input.permissionForOutcomeMetrics;
  const { error } = await db.from("founding_member_feedback").insert({
    user_id: user.id,
    feedback: input.feedback,
    consistency_helped: input.consistencyHelped,
    travel_adaptation_used: input.travelAdaptationUsed,
    schedule_adaptation_used: input.scheduleAdaptationUsed,
    equipment_substitution_used: input.equipmentSubstitutionUsed,
    decision_fatigue_reduced: input.decisionFatigueReduced,
    permission_to_quote: input.permissionToQuote,
    permission_for_case_study: input.permissionForCaseStudy,
    permission_for_outcome_metrics: input.permissionForOutcomeMetrics,
    consent_recorded_at: consentGiven ? new Date().toISOString() : null,
  });
  if (error) return NextResponse.json({ error: "Feedback could not be saved yet." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
