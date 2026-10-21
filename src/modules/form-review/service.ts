import { formRubricFor } from "@/modules/methodology/form-rubrics";
import { FORM_REVIEW_MAX_BYTES, FORM_REVIEW_MAX_SECONDS, FORM_REVIEW_MONTHLY_QUOTA, type FormReviewResult } from "./contracts";

export const formReviewFlags = {
  publicEnabled: process.env.FORM_REVIEW_PUBLIC_ENABLED === "true",
  processingEnabled: process.env.FORM_REVIEW_PROCESSING_ENABLED === "true",
  pilotEnabled: process.env.FORM_REVIEW_PILOT_ENABLED === "true",
  pilotProcessingEnabled: process.env.FORM_REVIEW_PILOT_PROCESSING_ENABLED === "true",
} as const;

export function isFormReviewUserEnabled(userId: string) {
  if (formReviewFlags.publicEnabled) return true;
  const pilotUsers = new Set((process.env.FORM_REVIEW_PILOT_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  return formReviewFlags.pilotEnabled && pilotUsers.has(userId);
}

export function isFormReviewProcessingEnabled(userId: string) {
  if (formReviewFlags.processingEnabled) return true;
  const pilotUsers = new Set((process.env.FORM_REVIEW_PILOT_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  return formReviewFlags.pilotProcessingEnabled && pilotUsers.has(userId);
}

export function validateReviewEligibility(input: { exerciseSlug: string; byteSize: number; mediaType: string; durationSeconds?: number; monthlyCount: number }) {
  if (!formRubricFor(input.exerciseSlug)) return { ok: false as const, code: "UNSUPPORTED_EXERCISE", message: "Form review is currently available for five reviewed exercises." };
  if (input.monthlyCount >= FORM_REVIEW_MONTHLY_QUOTA) return { ok: false as const, code: "QUOTA_REACHED", message: "Your monthly form-review limit has been reached." };
  if (input.byteSize > FORM_REVIEW_MAX_BYTES) return { ok: false as const, code: "FILE_TOO_LARGE", message: "Choose a video under 50 MB." };
  if (!["video/mp4", "video/quicktime"].includes(input.mediaType)) return { ok: false as const, code: "UNSUPPORTED_MEDIA", message: "Choose an MP4 or MOV video." };
  if (input.durationSeconds !== undefined && input.durationSeconds > FORM_REVIEW_MAX_SECONDS) return { ok: false as const, code: "CLIP_TOO_LONG", message: "Choose a clip no longer than 30 seconds." };
  return { ok: true as const };
}

export function providerUnavailableResult(reviewId: string, exerciseSlug: string, cameraView: "front" | "side" | "rear" | "unknown"): FormReviewResult {
  const rubric = formRubricFor(exerciseSlug);
  if (!rubric) throw new Error("UNSUPPORTED_EXERCISE");
  return { review_id: reviewId, exercise_id: exerciseSlug, rubric_version: rubric.version, methodology_version: "2026.10", status: "abstained", visibility_quality: "insufficient", observations: [], positives: [], priorities: [], limitations: [rubric.limitations, `Selected camera view: ${cameraView}.`, "Video processing is not enabled because chargeable inference has not been authorized."], recommended_camera_view: rubric.cameraViews[0] ?? null, caution_note: "Recorded video cannot diagnose injury or guarantee that a movement is safe.", model_version: "none", processing_version: "app6b1.1", review_cost_estimate: 0, abstained: true };
}

export function safeObjectPath(userId: string, reviewId: string, fileName: string) {
  const extension = fileName.toLowerCase().endsWith(".mov") ? "mov" : "mp4";
  return `${userId}/${reviewId}/set.${extension}`;
}
