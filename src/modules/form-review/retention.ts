import type { SupabaseClient } from "@supabase/supabase-js";
import { FORM_REVIEW_BUCKET } from "./contracts";

export type RetentionResult = { deleted: number; failed: number; unavailable?: boolean };

export async function purgeExpiredFormReviews(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<RetentionResult> {
  const { data, error } = await supabase.rpc("claim_expired_form_reviews", {
    max_reviews: 100,
    lease_seconds: 300,
    evaluation_now: now.toISOString(),
  });
  if (error) return { deleted: 0, failed: 0, unavailable: true };

  let deleted = 0;
  let failed = 0;
  for (const review of data ?? []) {
    const { error: storageError } = await supabase.storage
      .from(FORM_REVIEW_BUCKET)
      .remove([review.object_path]);
    if (storageError) {
      const attempts = Number(review.cleanup_attempt_count ?? 0) + 1;
      const nextAttempt = new Date(now.getTime() + Math.min(24 * 60 * 60_000, 60_000 * 2 ** Math.min(attempts, 10)));
      await supabase
        .from("coach_form_reviews")
        .update({
          cleanup_attempt_count: attempts,
          cleanup_failure_reason: "PRIVATE_OBJECT_DELETE_FAILED",
          cleanup_next_attempt_at: nextAttempt.toISOString(),
          cleanup_lease_token: null,
          cleanup_lease_expires_at: null,
          updated_at: now.toISOString(),
        })
        .eq("id", review.id)
        .eq("cleanup_lease_token", review.cleanup_lease_token);
      failed += 1;
      continue;
    }
    const { error: updateError } = await supabase
      .from("coach_form_reviews")
      .update({
        processing_status: "deleted",
        upload_status: "deleted",
        structured_result: null,
        member_question: null,
        cleanup_failure_reason: null,
        cleanup_lease_token: null,
        cleanup_lease_expires_at: null,
        deleted_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", review.id)
      .eq("cleanup_lease_token", review.cleanup_lease_token)
      .neq("processing_status", "deleted");
    if (updateError) failed += 1;
    else deleted += 1;
  }
  return { deleted, failed };
}
