import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/analytics/server";
import { actionIntent, answerQuality, classifyCoachRequest, COACH_SERVICE_ERROR, OUT_OF_DOMAIN, safetyResponse } from "@/modules/coach/orchestration";
import { proposeAdjustment } from "@/modules/coaching/engine";

const Input = z.object({ conversationId: z.uuid().optional(), message: z.string().trim().min(1).max(4000) });

async function context() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function GET() {
  const c = await context();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await c.supabase.from("coach_conversations").select("id,title,updated_at,coach_messages(id,role,content,domain,created_at)").eq("user_id", c.user.id).order("updated_at", { ascending: false }).limit(20);
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  const c = await context();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  let conversationId = parsed.data.conversationId;
  if (!conversationId) {
    const { data, error } = await c.supabase.from("coach_conversations").insert({ user_id: c.user.id, title: parsed.data.message.slice(0, 70) }).select("id").single();
    if (error) return NextResponse.json({ error: COACH_SERVICE_ERROR }, { status: 500 });
    conversationId = data.id;
  } else {
    const { data } = await c.supabase.from("coach_conversations").select("id").eq("id", conversationId).eq("user_id", c.user.id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const domain = classifyCoachRequest(parsed.data.message);
  const safety = domain === "safety" ? safetyResponse(parsed.data.message) : { classification: "normal", copy: "" };
  await Promise.all([
    captureServerEvent("coach_question_sent", c.user.id, { has_conversation: Boolean(parsed.data.conversationId) }),
    captureServerEvent("coach_domain_classified", c.user.id, { domain, safety_classification: safety.classification }),
  ]);
  const { data: userMessage } = await c.supabase.from("coach_messages").insert({ user_id: c.user.id, conversation_id: conversationId, role: "user", content: parsed.data.message, domain, safety_classification: safety.classification }).select("id").single();

  let answer: string;
  let action = null;
  let evidenceIds: string[] = [];
  let model = "deterministic";
  if (domain === "out_of_domain") answer = OUT_OF_DOMAIN;
  else if (domain === "safety") answer = safety.copy;
  else if (domain === "action") {
    const intent = actionIntent(parsed.data.message);
    const proposal = proposeAdjustment(intent.intent, intent.scope);
    const { data: adjustment } = await c.supabase.from("plan_adjustment_requests").insert({ user_id: c.user.id, intent: intent.intent, explicit_context: { source_message_id: userMessage?.id }, scope: proposal.proposal?.scope ?? intent.scope, safety_classification: proposal.safety, proposal: proposal.proposal, reason_codes: proposal.reasonCodes, confirmation_status: proposal.blocked ? "blocked" : "pending" }).select("id,proposal,reason_codes,confirmation_status").single();
    action = adjustment;
    answer = proposal.blocked ? safetyResponse(parsed.data.message).copy : "I prepared the minimum necessary change for review. Nothing changes until you confirm it.";
  } else {
    const topics = domain === "technique" ? ["training"] : [domain];
    const [evidence, profile, nutrition, history, trainingSessions, recentPrs, workload, loadRecommendations, nutritionHistory] = await Promise.all([
      c.supabase.from("evidence_records").select("id,title,organization,claim_summary,evidence_tier,applicable_context,limitations,source_locator").eq("review_status", "reviewed").overlaps("topic_tags", topics).limit(5),
      c.supabase.from("personalization_profile_snapshots").select("profile,safety_classification").eq("user_id", c.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      domain === "nutrition" || domain === "supplements" ? c.supabase.from("nutrition_targets").select("calories_kcal,protein_g,carbohydrate_g,fat_g,fiber_g,target_range").eq("user_id", c.user.id).order("effective_from", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      c.supabase.from("coach_messages").select("role,content").eq("conversation_id", conversationId).eq("user_id", c.user.id).order("created_at", { ascending: false }).limit(8),
      c.supabase.from("workout_execution_sessions").select("id,workout_key,completed_at,session_effort,completion_summary").eq("user_id", c.user.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(3),
      c.supabase.from("personal_records").select("id,exercise_slug,record_type,value,secondary_value,unit,achieved_at").eq("user_id", c.user.id).eq("status", "active").order("achieved_at", { ascending: false }).limit(8),
      c.supabase.from("muscle_workload_weekly").select("period_start,muscle_group,planned_set_equivalents,completed_set_equivalents,algorithm_version").eq("user_id", c.user.id).order("period_start", { ascending: false }).limit(30),
      c.supabase.from("training_load_recommendations").select("exercise_slug,recommended_load,load_unit,confidence,reason_code,algorithm_version,evidence_snapshot,created_at").eq("user_id", c.user.id).order("created_at", { ascending: false }).limit(8),
      domain === "nutrition" ? c.supabase.from("nutrition_daily_summaries").select("local_date,calories,protein_g,carbs_g,fat_g,logging_status").eq("user_id", c.user.id).order("local_date", { ascending: false }).limit(14) : Promise.resolve({ data: null }),
    ]);
    evidenceIds = (evidence.data ?? []).map((item) => item.id);
    if (!process.env.OPENAI_API_KEY) {
      await captureServerEvent("coach_error", c.user.id, { stage: "configuration", domain });
      return NextResponse.json({ error: COACH_SERVICE_ERROR }, { status: 503 });
    }
    try {
      model = "gpt-5.4-mini";
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.responses.create({
        model,
        reasoning: { effort: "low" },
        max_output_tokens: 700,
        instructions: "You are STHENO Coach, an evidence-led fitness coach. Answer immediately, directly, calmly, and concisely. No praise, filler, canned headings, fake certainty, diagnosis, or invented citations. Use supplied member context when it changes the practical recommendation, including goal, current frequency, experience, schedule, equipment, recovery, adherence, and current program. Use only supplied reviewed evidence for scientific claims. Mention uncertainty and a practical next action when useful. Never claim to change a plan. If the user asks for a change, say it must go through STHENO's deterministic engine.",
        input: JSON.stringify({ question: parsed.data.message, domain, verifiedMemberContext: profile.data?.profile ?? null, currentNutritionTargets: nutrition.data, nutritionLoggingSnapshot: nutritionHistory.data ?? [], nutritionContextInstruction: "Only logging_status=complete may support adherence conclusions. Partial days are not evidence of under-eating. Never change a target or recommend a calorie cut when adherence evidence is poor; route changes through the deterministic review flow.", reviewedEvidence: evidence.data ?? [], recentConversation: (history.data ?? []).reverse(), authoritativeTrainingSnapshot: { last3Workouts: trainingSessions.data ?? [], recentPersonalRecords: recentPrs.data ?? [], currentMuscleWorkload: workload.data ?? [], loadRecommendations: loadRecommendations.data ?? [], instruction: "These persisted deterministic facts are authoritative. Never invent or alter a load, PR, adherence value, or workout result. When history is sparse, say so." } }),
      });
      answer = response.output_text.trim();
      if (!answerQuality(answer).passes) answer = "I don’t have a concise, evidence-aligned answer I can stand behind yet. Rephrase the fitness question with the specific goal or constraint that matters.";
    } catch {
      await captureServerEvent("coach_error", c.user.id, { stage: "generation", domain });
      return NextResponse.json({ error: COACH_SERVICE_ERROR }, { status: 503 });
    }
  }

  const { data: assistantMessage, error } = await c.supabase.from("coach_messages").insert({ user_id: c.user.id, conversation_id: conversationId, role: "assistant", content: answer, domain, safety_classification: safety.classification, evidence_ids: evidenceIds, model }).select("id").single();
  if (error) {
    await captureServerEvent("coach_error", c.user.id, { stage: "persistence", domain });
    return NextResponse.json({ error: COACH_SERVICE_ERROR }, { status: 500 });
  }
  await Promise.all([
    c.supabase.from("coach_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", c.user.id),
    captureServerEvent("coach_answer_returned", c.user.id, { domain, model, has_action: Boolean(action) }),
  ]);
  return NextResponse.json({ conversationId, messageId: assistantMessage.id, domain, answer, action, evidenceIds });
}
