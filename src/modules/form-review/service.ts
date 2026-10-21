import { formRubricFor } from "@/modules/methodology/form-rubrics";
import { FORM_REVIEW_MAX_BYTES, FORM_REVIEW_MAX_SECONDS, FORM_REVIEW_MONTHLY_QUOTA, type FormReviewResult } from "./contracts";

export const formReviewFlags = {
  publicEnabled: process.env.FORM_REVIEW_PUBLIC_ENABLED === "true",
  processingEnabled: process.env.FORM_REVIEW_PROCESSING_ENABLED === "true",
} as const;

export function validateReviewEligibility(input: { exerciseSlug: string; byteSize: number; mediaType: string; durationSeconds?: number; monthlyCount: number }) {
  if (!formRubricFor(input.exerciseSlug)) return { ok: false as const, code: "UNSUPPORTED_EXERCISE", message: "Form review is currently available for five reviewed exercises." };
  if (input.monthlyCount >= FORM_REVIEW_MONTHLY_QUOTA) return { ok: false as const, code: "QUOTA_REACHED", message: "Your monthly form-review limit has been reached." };
  if (input.byteSize > FORM_REVIEW_MAX_BYTES) return { ok: false as const, code: "FILE_TOO_LARGE", message: "Choose a video under 75 MB." };
  if (!["video/mp4", "video/quicktime"].includes(input.mediaType)) return { ok: false as const, code: "UNSUPPORTED_MEDIA", message: "Choose an MP4 or MOV video." };
  if (input.durationSeconds !== undefined && input.durationSeconds > FORM_REVIEW_MAX_SECONDS) return { ok: false as const, code: "CLIP_TOO_LONG", message: "Choose a clip no longer than 30 seconds." };
  return { ok: true as const };
}

export function providerUnavailableResult(reviewId: string, exerciseSlug: string, cameraView: "front" | "side" | "rear" | "unknown"): FormReviewResult {
  const rubric = formRubricFor(exerciseSlug);
  if (!rubric) throw new Error("UNSUPPORTED_EXERCISE");
  return { review_id: reviewId, exercise_id: exerciseSlug, rubric_version: rubric.version, camera_view: cameraView, video_quality: "unsupported", confidence: "insufficient", observations: [], cues: [], limitations: [rubric.limitations, "Video processing is not enabled because no approved no-extra-cost processor has passed privacy, quality, and retention review."], rerecord_guidance: null, abstained: true, safety_flags: [] };
}

export function safeObjectPath(userId: string, reviewId: string, fileName: string) {
  const extension = fileName.toLowerCase().endsWith(".mov") ? "mov" : "mp4";
  return `${userId}/${reviewId}/set.${extension}`;
}
