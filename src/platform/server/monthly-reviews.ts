import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MONTHLY_REVIEW_ENGINE_VERSION, MONTHLY_REVIEW_RULESET_VERSION, validateMonthlyAction, type MonthlyAction } from "@/modules/monthly-review/engine";

export async function monthlyReviews(db: SupabaseClient, userId: string) {
  const [state, reviews, recommendations] = await Promise.all([
    db.from("member_review_state").select("*").eq("user_id", userId).maybeSingle(),
    db.from("monthly_reviews").select("*").eq("user_id", userId).order("due_at", { ascending: false }).limit(24),
    db.from("monthly_recommendations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  if (state.error || reviews.error || recommendations.error) throw new Error("MONTHLY_REVIEWS_READ_FAILED");
  return { state: state.data, reviews: reviews.data ?? [], recommendations: recommendations.data ?? [] };
}

export async function decideMonthlyRecommendations(db: SupabaseClient, userId: string, reviewId: string, action: "apply" | "keep", acceptedIds: string[]) {
  const { data: review } = await db.from("monthly_reviews").select("id,status").eq("id", reviewId).eq("user_id", userId).maybeSingle();
  if (!review) return null;
  const { data: rows, error } = await db.from("monthly_recommendations").select("*").eq("monthly_review_id", reviewId).eq("user_id", userId);
  if (error) throw new Error(`MONTHLY_RECOMMENDATIONS_READ_FAILED:${error.message}`);
  const accepted = new Set(action === "keep" ? [] : acceptedIds);
  const unknown = [...accepted].filter((id) => !(rows ?? []).some((row) => row.id === id));
  if (unknown.length) throw new Error("MONTHLY_RECOMMENDATION_NOT_FOUND");
  const now = new Date().toISOString(), applied: string[] = [], declined: string[] = [];
  for (const row of rows ?? []) {
    const isAccepted = accepted.has(row.id);
    if (row.status !== "pending") {
      if (row.status === "accepted") applied.push(row.id); else declined.push(row.id);
      continue;
    }
    const monthlyAction: MonthlyAction = { type: row.type, scope: row.scope, beforeState: row.before_state, afterState: row.after_state, reasonCodes: row.reason_codes, plainLanguageReason: row.plain_language_reason };
    if (isAccepted && !validateMonthlyAction(monthlyAction)) throw new Error("MONTHLY_RECOMMENDATION_INVALID");
    const status = isAccepted ? "accepted" : "declined";
    const { data: claimed, error: claimError } = await db.from("monthly_recommendations").update({ status, decided_at: now }).eq("id", row.id).eq("user_id", userId).eq("status", "pending").select("id").maybeSingle();
    if (claimError) throw new Error(`MONTHLY_DECISION_FAILED:${claimError.message}`);
    if (!claimed) continue;
    if (!isAccepted) { declined.push(row.id); continue; }
    if (row.type === "calorie_change") {
      const { data: current } = await db.from("nutrition_targets").select("*").eq("user_id", userId).is("effective_to", null).order("effective_from", { ascending: false }).limit(1).maybeSingle();
      if (current) {
        await db.from("nutrition_targets").update({ effective_to: now.slice(0, 10) }).eq("id", current.id).eq("user_id", userId);
        const { id: _id, created_at: _createdAt, ...copy } = current;
        void _id; void _createdAt;
        await db.from("nutrition_targets").insert({ ...copy, user_id: userId, calories_kcal: Number(row.after_state.calories), effective_from: now.slice(0, 10), effective_to: null, reason_code: "MONTHLY_REVIEW_ACCEPTED", engine_version: MONTHLY_REVIEW_ENGINE_VERSION, ruleset_version: MONTHLY_REVIEW_RULESET_VERSION });
      }
    }
    await Promise.all([
      db.from("coach_decisions").insert({ user_id: userId, decision_type: row.scope, reason_code: row.reason_codes[0] ?? "MONTHLY_REVIEW_ACCEPTED", prior_state: row.before_state, new_state: row.after_state, structured_inputs: { monthly_review_id: reviewId, recommendation_id: row.id }, scope: "current_program", source: "monthly_review", confirmation_required: true, confirmation_status: "committed", engine_version: MONTHLY_REVIEW_ENGINE_VERSION, ruleset_version: MONTHLY_REVIEW_RULESET_VERSION }),
      db.from("fitness_memory_entries").insert({ user_id: userId, source_type: "monthly_recommendation", source_id: row.id, memory: { type: row.type, status: "accepted", after_state: row.after_state } }),
    ]);
    applied.push(row.id);
  }
  return { accepted: applied, declined };
}
