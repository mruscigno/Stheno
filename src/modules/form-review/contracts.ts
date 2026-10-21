import { z } from "zod";

export const FORM_REVIEW_CONSENT_VERSION = "2026.10-app6b.1";
export const FORM_REVIEW_MAX_BYTES = 50 * 1024 * 1024;
export const FORM_REVIEW_MAX_SECONDS = 30;
export const FORM_REVIEW_RETENTION_DAYS = 30;
export const FORM_REVIEW_MONTHLY_QUOTA = 4;
export const FORM_REVIEW_MAX_RETRIES = 3;
export const FORM_REVIEW_BUCKET = "coach-form-videos";

export const cameraViewSchema = z.enum(["front", "side", "rear", "unknown"]);
export const uploadIntentSchema = z.object({
  exerciseId: z.string().min(1).max(120),
  cameraView: cameraViewSchema,
  fileName: z.string().min(1).max(180),
  byteSize: z.number().int().positive().max(FORM_REVIEW_MAX_BYTES),
  mediaType: z.enum(["video/mp4", "video/quicktime"]),
  consentVersion: z.literal(FORM_REVIEW_CONSENT_VERSION),
  consentAccepted: z.literal(true),
  conversationId: z.uuid().optional(),
  question: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().min(12).max(120),
});
export const submitReviewSchema = z.object({
  reviewId: z.uuid(),
  durationSeconds: z.number().positive().max(FORM_REVIEW_MAX_SECONDS),
});

export const formReviewResultSchema = z.object({
  review_id: z.string(),
  exercise_id: z.string(),
  rubric_version: z.string(),
  methodology_version: z.string(),
  status: z.enum(["completed", "abstained"]),
  visibility_quality: z.enum(["good", "partial", "insufficient"]),
  limitations: z.array(z.string()).max(8),
  observations: z.array(z.object({
    checkpoint_id: z.string(),
    timestamp_range: z.object({ start: z.number().nonnegative(), end: z.number().nonnegative() }),
    observation: z.string(),
    evidence_description: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    actionable_cue: z.string(),
  })).max(6),
  positives: z.array(z.string()).max(3),
  priorities: z.array(z.string()).max(3),
  recommended_camera_view: z.string().nullable(),
  caution_note: z.string(),
  model_version: z.string(),
  processing_version: z.string(),
  review_cost_estimate: z.number().nonnegative(),
  abstained: z.boolean(),
});

export type FormReviewResult = z.infer<typeof formReviewResultSchema>;
