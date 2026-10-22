import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function monthlyReviews(db: SupabaseClient, userId: string) {
  const [state, reviews, recommendations] = await Promise.all([
    db.from("member_review_state").select("*").eq("user_id", userId).maybeSingle(),
    db.from("monthly_reviews").select("*").eq("user_id", userId).order("due_at", { ascending: false }).limit(24),
    db.from("monthly_recommendations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  if (state.error || reviews.error || recommendations.error) throw new Error("MONTHLY_REVIEWS_READ_FAILED");
  return { state: state.data, reviews: reviews.data ?? [], recommendations: recommendations.data ?? [] };
}

export async function decideMonthlyRecommendations(db: SupabaseClient, userId: string, reviewId: string, action: "apply" | "keep", acceptedIds: string[], operationId = crypto.randomUUID()) {
  void userId;
  const { data, error } = await db.rpc("apply_monthly_review_decision", { p_review_id: reviewId, p_operation_id: operationId, p_action: action, p_accepted_ids: acceptedIds });
  if (error) {
    if (error.message.includes("NOT_FOUND")) return null;
    if (error.message.includes("RECOMMENDATION_NOT_FOUND")) throw new Error("MONTHLY_RECOMMENDATION_NOT_FOUND");
    throw new Error(`MONTHLY_DECISION_FAILED:${error.message}`);
  }
  return data as { accepted: string[]; declined: string[] };
}
