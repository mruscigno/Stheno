import { afterEach, describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { budgetAllowsReview, estimateReviewCost, readBudgetConfig } from "./budget";
import { analyzeFormFrames } from "./inference";
import { decodeAndSampleVideo, sampleTimestamps } from "./media";

const originalEnvironment = { ...process.env };
afterEach(() => { process.env = { ...originalEnvironment }; vi.restoreAllMocks(); });

describe("App 6B-1 bounded processing", () => {
  it("samples the full clip in at most twelve phases", () => {
    const timestamps = sampleTimestamps(30);
    expect(timestamps).toHaveLength(12);
    expect(timestamps[0]).toBeLessThan(1);
    expect(timestamps.at(-1)).toBeGreaterThan(29);
    expect(new Set(timestamps).size).toBe(12);
  });

  it("decodes a licensed repository video into bounded metadata-free JPEG frames", async () => {
    const bytes = await readFile(resolve("public/exercise-media/vital/videos/goblet-squat.mp4"));
    const decoded = await decodeAndSampleVideo(bytes);
    expect(decoded.durationSeconds).toBeGreaterThan(0);
    expect(decoded.durationSeconds).toBeLessThanOrEqual(30);
    expect(decoded.frames.length).toBeGreaterThanOrEqual(4);
    expect(decoded.frames.length).toBeLessThanOrEqual(12);
    expect(decoded.frames.every((frame) => frame.jpeg[0] === 0xff && frame.jpeg[1] === 0xd8)).toBe(true);
  }, 60_000);

  it("rejects malformed media before inference", async () => {
    await expect(decodeAndSampleVideo(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow("INVALID_MEDIA_SIZE");
  });

  it("keeps the budget gate closed without explicit positive caps", () => {
    delete process.env.FORM_REVIEW_BUDGET_KILL_SWITCH;
    delete process.env.FORM_REVIEW_MAX_COST_USD;
    delete process.env.FORM_REVIEW_MONTHLY_BUDGET_USD;
    expect(readBudgetConfig().perReviewCap).toBe(0);
    expect(budgetAllowsReview(0)).toBe(false);
  });

  it("opens only when the kill switch and both caps cover the conservative estimate", () => {
    process.env.FORM_REVIEW_BUDGET_KILL_SWITCH = "open";
    process.env.FORM_REVIEW_MAX_COST_USD = "0.01";
    process.env.FORM_REVIEW_MONTHLY_BUDGET_USD = "1";
    expect(budgetAllowsReview(0)).toBe(true);
    expect(estimateReviewCost(40_000, 2_000)).toBeCloseTo(0.005);
  });

  it("accepts only rubric checkpoints and sampled timestamps", async () => {
    const output = {
      review_id: "ignored", exercise_id: "ignored", rubric_version: "ignored", methodology_version: "ignored", status: "completed", visibility_quality: "good", limitations: ["Only sampled still frames were reviewed."],
      observations: [{ checkpoint_id: "feet remain planted", timestamp_range: { start: 0, end: 1 }, observation: "Both feet appear planted.", evidence_description: "Visible in the sampled frames.", confidence: "medium", actionable_cue: "Keep the whole foot in contact." }],
      positives: ["Foot contact appears consistent."], priorities: ["Keep the whole foot planted."], recommended_camera_view: null, caution_note: "Video cannot diagnose injury or guarantee safety.", model_version: "ignored", processing_version: "ignored", review_cost_estimate: 0, abstained: false,
    };
    const client = { responses: { parse: vi.fn().mockResolvedValue({ output_parsed: output, usage: { input_tokens: 1000, output_tokens: 200 } }) } } as unknown as OpenAI;
    const result = await analyzeFormFrames({ reviewId: "review-a", exerciseSlug: "goblet-squat", cameraView: "side", frames: [{ timestampSeconds: 0, jpeg: Buffer.from("a") }, { timestampSeconds: 1, jpeg: Buffer.from("b") }], client });
    expect(result.result.observations[0]?.checkpoint_id).toBe("feet remain planted");
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it("rejects invented checkpoints", async () => {
    const output = {
      review_id: "ignored", exercise_id: "ignored", rubric_version: "ignored", methodology_version: "ignored", status: "completed", visibility_quality: "good", limitations: [],
      observations: [{ checkpoint_id: "exact knee angle", timestamp_range: { start: 0, end: 1 }, observation: "Invented", evidence_description: "Invented", confidence: "high", actionable_cue: "Invented" }],
      positives: [], priorities: [], recommended_camera_view: null, caution_note: "Limitations apply.", model_version: "ignored", processing_version: "ignored", review_cost_estimate: 0, abstained: false,
    };
    const client = { responses: { parse: vi.fn().mockResolvedValue({ output_parsed: output, usage: { input_tokens: 1, output_tokens: 1 } }) } } as unknown as OpenAI;
    await expect(analyzeFormFrames({ reviewId: "review-a", exerciseSlug: "goblet-squat", cameraView: "side", frames: [{ timestampSeconds: 0, jpeg: Buffer.from("a") }, { timestampSeconds: 1, jpeg: Buffer.from("b") }], client })).rejects.toThrow("UNGROUNDED_MODEL_OUTPUT");
  });
});

