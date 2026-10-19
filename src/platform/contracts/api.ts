import { z } from "zod";

export const API_VERSION = "1.0" as const;

export const ApiErrorCode = z.enum([
  "AUTH_REQUIRED",
  "ACCESS_EXPIRED",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

export const PaginationQuery = z.object({
  cursor: z.string().trim().min(1).max(160).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const ExerciseListQuery = PaginationQuery.extend({
  query: z.string().trim().max(100).optional(),
  equipment: z.string().trim().max(40).optional(),
  muscle: z.string().trim().max(40).optional(),
  pattern: z.string().trim().max(40).optional(),
});

export const StartWorkoutInput = z.object({
  operationId: z.uuid(),
  clientSessionKey: z.uuid(),
  workoutKey: z.string().trim().min(1).max(120).optional(),
});

export const UpsertWorkoutSetInput = z.object({
  operationId: z.uuid(),
  baseRevision: z.number().int().min(0).optional(),
  exerciseSlug: z.string().trim().min(1).max(160),
  setOrdinal: z.number().int().min(1).max(20),
  setType: z.enum(["warmup", "working", "backoff", "drop", "failure", "optional"]).default("working"),
  prescribed: z.record(z.string(), z.unknown()),
  load: z.number().min(0).max(100000).nullable().optional(),
  loadUnit: z.enum(["lb", "kg"]).default("lb"),
  repetitions: z.number().int().min(0).max(200).nullable().optional(),
  rir: z.number().min(0).max(10).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  state: z.enum(["completed", "skipped"]),
  clientTimestamp: z.iso.datetime().optional(),
});

export const CompleteWorkoutInput = z.object({
  operationId: z.uuid(),
  baseRevision: z.number().int().min(0).optional(),
  effort: z.enum(["too_easy", "about_right", "very_hard", "couldnt_finish"]),
  note: z.string().trim().max(2000).optional(),
  allowIncomplete: z.boolean().default(false),
});

export const MonthlyDecisionInput = z.object({
  operationId: z.uuid(),
  action: z.enum(["apply", "keep"]),
  acceptedIds: z.array(z.uuid()).max(50).default([]),
});

export type ApiSuccess<T> = {
  apiVersion: typeof API_VERSION;
  requestId: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  apiVersion: typeof API_VERSION;
  requestId: string;
  error: { code: ApiErrorCode; message: string; details?: unknown };
};

export type MemberReadModel = {
  id: string;
  email: string | null;
  profile: { display_name: string | null; lifecycle_state: string | null; time_zone: string | null; created_at: string; updated_at: string } | null;
  preferences: { unit_system: string | null; locale: string | null } | null;
  access: { hasAccess: boolean; state: string; trialEndsAt?: string | null; daysRemaining?: number };
  subscription: { status: string; billing_interval: string | null; current_period_ends_at: string | null; updated_at: string } | null;
  entitlements: Array<{ entitlement_key: string; active: boolean; starts_at: string | null; ends_at: string | null }>;
};

export type TodayReadModel = {
  activeWorkout: { id: string; workout_key: string; status: string; original_workout: unknown; revised_workout: unknown; current_exercise_index: number; started_at: string; updated_at: string } | null;
  program: { id: string; program_id: string; prescription: { name?: string; workouts?: Array<{ key?: string; name?: string; exercises?: unknown[] }> }; prescribed_at: string } | null;
  review: { next_monthly_review_at: string | null; monthly_review_due: boolean; monthly_review_status: string | null } | null;
  nutrition: { calories_kcal: number; protein_g: number; carbohydrate_g: number; fat_g: number; effective_from: string } | null;
};

export type OperationAcknowledgement<T> = {
  operationId: string;
  revision: number;
  acknowledgedAt: string;
  replayed: boolean;
  result: T;
};
