import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReviewProvider = {
  providerName: string;
  profileUrl: string;
  rating: number | null;
  reviewCount: number;
};
export const getActiveReviewProvider = unstable_cache(
  async (): Promise<ReviewProvider | null> => {
    const db = createSupabaseAdminClient();
    if (!db) return null;
    const { data } = await db
      .from("review_provider_configs")
      .select("provider_name,profile_url,rating,review_count")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      providerName: data.provider_name,
      profileUrl: data.profile_url,
      rating: data.rating === null ? null : Number(data.rating),
      reviewCount: data.review_count,
    };
  },
  ["active-review-provider"],
  { revalidate: 3600 },
);
export function publicReviewSummary(provider: ReviewProvider) {
  const threshold = Number(process.env.REVIEW_RATING_DISPLAY_THRESHOLD ?? 10);
  return Number.isFinite(threshold) &&
    provider.reviewCount >= threshold &&
    provider.rating !== null
    ? { rating: provider.rating, reviewCount: provider.reviewCount }
    : null;
}
