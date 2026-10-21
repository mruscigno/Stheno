import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { formRubricFor } from "@/modules/methodology/form-rubrics";
import { METHODOLOGY_VERSION } from "@/modules/methodology";
import { formReviewResultSchema, type FormReviewResult } from "./contracts";
import { estimateReviewCost, FORM_REVIEW_MODEL } from "./budget";
import type { ExtractedFrame } from "./media";

export type InferenceOutput = { result: FormReviewResult; inputTokens: number; outputTokens: number; costUsd: number };

export async function analyzeFormFrames(input: {
  reviewId: string;
  exerciseSlug: string;
  cameraView: string;
  frames: ExtractedFrame[];
  client?: OpenAI;
}): Promise<InferenceOutput> {
  const rubric = formRubricFor(input.exerciseSlug);
  if (!rubric) throw new Error("UNSUPPORTED_EXERCISE");
  if (!process.env.OPENAI_API_KEY && !input.client) throw new Error("OPENAI_NOT_CONFIGURED");
  const client = input.client ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sampledTimes = input.frames.map((frame) => frame.timestampSeconds);
  const response = await client.responses.parse({
    model: FORM_REVIEW_MODEL,
    reasoning: { effort: "low" },
    max_output_tokens: 1800,
    text: { format: zodTextFormat(formReviewResultSchema, "stheno_form_review") },
    instructions: "You are a conservative fitness form-review assistant. Describe only visible evidence in the supplied sampled frames and only against the supplied reviewed rubric. Never diagnose, infer pain or exact joint loading, estimate angles, guarantee safety, or invent motion between frames. If framing, lighting, phase coverage, exercise identity, or evidence is insufficient, abstain. Use at most three practical priorities and neutral language.",
    input: [{ role: "user", content: [
      { type: "input_text", text: JSON.stringify({ reviewId: input.reviewId, exercise: input.exerciseSlug, cameraView: input.cameraView, sampledTimes, rubric, methodologyVersion: METHODOLOGY_VERSION, outputRules: "Timestamp ranges must use only supplied sampledTimes. checkpoint_id must exactly match one observable checkpoint. Set model_version and processing_version exactly as supplied.", modelVersion: FORM_REVIEW_MODEL, processingVersion: "app6b1.1" }) },
      ...input.frames.map((frame) => ({ type: "input_image" as const, image_url: `data:image/jpeg;base64,${frame.jpeg.toString("base64")}`, detail: "low" as const })),
    ] }],
  });
  const parsed = response.output_parsed;
  if (!parsed) throw new Error("MODEL_OUTPUT_INVALID");
  const checkpoints = new Set(rubric.observableCheckpoints);
  const allowedTimes = new Set(sampledTimes.map((value) => value.toFixed(3)));
  const grounded = parsed.observations.every((observation) => checkpoints.has(observation.checkpoint_id) && [observation.timestamp_range.start, observation.timestamp_range.end].every((value) => allowedTimes.has(value.toFixed(3))));
  if (!grounded) throw new Error("UNGROUNDED_MODEL_OUTPUT");
  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const costUsd = estimateReviewCost(inputTokens, outputTokens);
  const result = formReviewResultSchema.parse({ ...parsed, review_id: input.reviewId, exercise_id: input.exerciseSlug, rubric_version: rubric.version, methodology_version: METHODOLOGY_VERSION, model_version: FORM_REVIEW_MODEL, processing_version: "app6b1.1", review_cost_estimate: costUsd });
  return { result, inputTokens, outputTokens, costUsd };
}

