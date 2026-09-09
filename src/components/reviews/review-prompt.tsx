import { ReviewPromptClient } from "@/components/reviews/review-prompt-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveReviewProvider } from "@/modules/reviews/provider";
function reviewWindowStart(){return new Date(Date.now()-30*86400000).toISOString()}
export async function ReviewPrompt() {
  const [db, provider] = await Promise.all([
    createSupabaseServerClient(),
    getActiveReviewProvider(),
  ]);
  if (!db || !provider) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const since = reviewWindowStart();
  const [workouts, reviews, priorPrompt] = await Promise.all([
    db
      .from("workout_execution_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    db
      .from("monthly_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    db
      .from("review_prompt_events")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle(),
  ]);
  if (
    priorPrompt.data ||
    ((workouts.count ?? 0) < 3 && (reviews.count ?? 0) < 1)
  )
    return null;
  const milestone =
    (reviews.count ?? 0) > 0
      ? "monthly_review_completed"
      : "three_workouts_completed";
  return (
    <ReviewPromptClient
      providerName={provider.providerName}
      profileUrl={provider.profileUrl}
      milestone={milestone}
    />
  );
}
