import { describe, expect, it } from "vitest";
import { comparisons, publishedComparisons } from "./catalog";

describe("comparison publishing gate", () => {
  it("publishes only sourced and dated comparisons", () => { expect(publishedComparisons.length).toBeGreaterThan(0); for (const item of publishedComparisons) { expect(item.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(item.sourceUrls.every((url) => url.startsWith("https://"))).toBe(true); expect(item.chooseSthenoIf).toBeTruthy(); expect(item.chooseThemIf).toBeTruthy(); } });
  it("publishes the verified Level Fitness comparison", () => { const level = comparisons.find((item) => item.slug === "level"); expect(level?.published).toBe(true); expect(level?.sourceUrls).toContain("https://levelfit.ai/"); expect(level?.verifiedAt).toBe("2026-08-26"); });
});
