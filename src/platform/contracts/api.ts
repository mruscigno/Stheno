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

export type OperationAcknowledgement<T> = {
  operationId: string;
  revision: number;
  acknowledgedAt: string;
  replayed: boolean;
  result: T;
};
