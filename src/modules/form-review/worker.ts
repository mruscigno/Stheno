import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeFormFrames } from "./inference";
import { budgetAllowsReview, readBudgetConfig } from "./budget";
import { FORM_REVIEW_BUCKET, FORM_REVIEW_MAX_RETRIES } from "./contracts";
import { decodeAndSampleVideo } from "./media";
import { isFormReviewProcessingEnabled } from "./service";

type ReviewJob = {
  id: string;
  user_id: string;
  exercise_slug: string;
  camera_view: string;
  object_path: string;
  attempt_count: number;
  lease_token: string;
  processing_status: string;
};

function failureKind(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : 0;
  const message = error instanceof Error ? error.message : "UNKNOWN_PROCESSING_FAILURE";
  const transient = status === 408 || status === 409 || status === 429 || status >= 500 || /timeout|temporar|rate/i.test(message);
  return { code: message.slice(0, 120), transient };
}

async function monthlySpend(supabase: SupabaseClient) {
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase.from("coach_form_reviews").select("estimated_cost_usd").gte("created_at", since.toISOString());
  if (error) throw new Error("BUDGET_LOOKUP_FAILED");
  return (data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0);
}

async function failOrRetry(supabase: SupabaseClient, job: ReviewJob, error: unknown) {
  const failure = failureKind(error);
  const attempt = job.attempt_count + 1;
  const retry = failure.transient && attempt < FORM_REVIEW_MAX_RETRIES;
  const nextAttempt = new Date(Date.now() + Math.min(15 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1)));
  await supabase.from("coach_form_reviews").update({
    processing_status: retry ? "queued" : "failed",
    attempt_count: attempt,
    failure_reason: failure.code,
    next_attempt_at: nextAttempt.toISOString(),
    lease_token: null,
    lease_expires_at: null,
    updated_at: new Date().toISOString(),
  }).eq("id", job.id).eq("lease_token", job.lease_token).eq("processing_status", "processing");
  return retry ? "retried" : "failed";
}

export async function processFormReviewJob(supabase: SupabaseClient, job: ReviewJob) {
  if (!isFormReviewProcessingEnabled(job.user_id)) return failOrRetry(supabase, job, new Error("PROCESSING_NOT_AUTHORIZED"));
  const spend = await monthlySpend(supabase);
  if (!budgetAllowsReview(spend)) return failOrRetry(supabase, job, new Error("BUDGET_GATE_CLOSED"));
  try {
    const { data: media, error: mediaError } = await supabase.storage.from(FORM_REVIEW_BUCKET).download(job.object_path);
    if (mediaError || !media) throw new Error("PRIVATE_MEDIA_UNAVAILABLE");
    const decoded = await decodeAndSampleVideo(new Uint8Array(await media.arrayBuffer()));
    const inference = await analyzeFormFrames({ reviewId: job.id, exerciseSlug: job.exercise_slug, cameraView: job.camera_view, frames: decoded.frames });
    const config = readBudgetConfig();
    if (inference.costUsd > config.perReviewCap) throw new Error("ACTUAL_COST_CAP_EXCEEDED");
    const { data: updated, error: updateError } = await supabase.from("coach_form_reviews").update({
      processing_status: inference.result.abstained ? "abstained" : "completed",
      structured_result: inference.result,
      duration_seconds: decoded.durationSeconds,
      frame_count: decoded.frames.length,
      provider: "openai",
      provider_version: inference.result.model_version,
      processing_version: inference.result.processing_version,
      model_input_tokens: inference.inputTokens,
      model_output_tokens: inference.outputTokens,
      usage_units: inference.inputTokens + inference.outputTokens,
      estimated_cost_usd: inference.costUsd,
      attempt_count: job.attempt_count + 1,
      failure_reason: null,
      completed_at: new Date().toISOString(),
      lease_token: null,
      lease_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id).eq("lease_token", job.lease_token).eq("processing_status", "processing").select("id").maybeSingle();
    if (updateError) throw new Error("RESULT_PERSISTENCE_FAILED");
    return updated ? "completed" : "cancelled";
  } catch (error) {
    return failOrRetry(supabase, job, error);
  }
}

export async function drainFormReviewJobs(supabase: SupabaseClient, maxJobs = 2) {
  const { data, error } = await supabase.rpc("claim_form_review_jobs", { max_jobs: maxJobs, lease_seconds: 240 });
  if (error) {
    if (/claim_form_review_jobs|schema cache/i.test(error.message)) return { claimed: 0, completed: 0, retried: 0, failed: 0, unavailable: true };
    throw error;
  }
  const outcomes = await Promise.all((data ?? []).map((job: ReviewJob) => processFormReviewJob(supabase, job)));
  return {
    claimed: outcomes.length,
    completed: outcomes.filter((value) => value === "completed").length,
    retried: outcomes.filter((value) => value === "retried").length,
    failed: outcomes.filter((value) => value === "failed").length,
    cancelled: outcomes.filter((value) => value === "cancelled").length,
  };
}

