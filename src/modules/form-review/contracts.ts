import { z } from "zod";

export const FORM_REVIEW_CONSENT_VERSION = "2026.10-app6b.1";
export const FORM_REVIEW_MAX_BYTES = 75 * 1024 * 1024;
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

export type FormReviewResult = {
  review_id: string;
  exercise_id: string;
  rubric_version: string;
  camera_view: z.infer<typeof cameraViewSchema>;
  video_quality: "adequate" | "poor" | "unsupported";
  confidence: "high" | "moderate" | "low" | "insufficient";
  observations: Array<{ checkpoint_id: string; behavior: string; actual_evidence_timestamps: number[]; confidence: number }>;
  cues: Array<{ cue: string; why: string; priority: number }>;
  limitations: string[];
  rerecord_guidance: string | null;
  abstained: boolean;
  safety_flags: string[];
};
