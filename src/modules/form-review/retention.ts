import type { SupabaseClient } from "@supabase/supabase-js";
import { FORM_REVIEW_BUCKET } from "./contracts";

export type RetentionResult = { deleted: number; failed: number; unavailable?: boolean };

export async function purgeExpiredFormReviews(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<RetentionResult> {
  const { data, error } = await supabase
    .from("coach_form_reviews")
    .select("id,object_path")
    .lt("retention_delete_at", now.toISOString())
    .neq("processing_status", "deleted")
    .limit(100);
  if (error) return { deleted: 0, failed: 0, unavailable: true };

  let deleted = 0;
  let failed = 0;
  for (const review of data ?? []) {
    const { error: storageError } = await supabase.storage
      .from(FORM_REVIEW_BUCKET)
      .remove([review.object_path]);
    if (storageError) {
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
        deleted_at: now.toISOString(),
      })
      .eq("id", review.id)
      .neq("processing_status", "deleted");
    if (updateError) failed += 1;
    else deleted += 1;
  }
  return { deleted, failed };
}
