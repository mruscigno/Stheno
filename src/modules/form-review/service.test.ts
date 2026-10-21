import { describe, expect, it } from "vitest";
import { providerUnavailableResult, safeObjectPath, validateReviewEligibility } from "./service";

describe("App 6B form review safety foundation", () => {
  it("limits coverage to reviewed App 6A exercises", () => {
    expect(validateReviewEligibility({ exerciseSlug: "goblet-squat", byteSize: 1000, mediaType: "video/mp4", monthlyCount: 0 }).ok).toBe(true);
    expect(validateReviewEligibility({ exerciseSlug: "pistol-squat", byteSize: 1000, mediaType: "video/mp4", monthlyCount: 0 })).toMatchObject({ ok: false, code: "UNSUPPORTED_EXERCISE" });
  });
  it("enforces size duration type and quota", () => {
    expect(validateReviewEligibility({ exerciseSlug: "barbell-rdl", byteSize: 80_000_000, mediaType: "video/mp4", monthlyCount: 0 }).ok).toBe(false);
    expect(validateReviewEligibility({ exerciseSlug: "barbell-rdl", byteSize: 1000, mediaType: "video/webm", monthlyCount: 0 }).ok).toBe(false);
    expect(validateReviewEligibility({ exerciseSlug: "barbell-rdl", byteSize: 1000, mediaType: "video/mp4", durationSeconds: 31, monthlyCount: 0 }).ok).toBe(false);
    expect(validateReviewEligibility({ exerciseSlug: "barbell-rdl", byteSize: 1000, mediaType: "video/mp4", monthlyCount: 4 }).ok).toBe(false);
  });
  it("abstains rather than inventing analysis when processing is unavailable", () => {
    const result = providerUnavailableResult("r1", "lat-pulldown", "front");
    expect(result.abstained).toBe(true);
    expect(result.observations).toHaveLength(0);
    expect(result.limitations.join(" ")).toMatch(/not been authorized/);
  });
  it("keeps objects in the authenticated owner's folder", () => expect(safeObjectPath("user-a", "review-1", "clip.MOV")).toBe("user-a/review-1/set.mov"));
});
