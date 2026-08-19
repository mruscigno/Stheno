import { describe, expect, it } from "vitest";
import { comparisons, publishedComparisons } from "./catalog";

describe("comparison publishing gate", () => {
  it("publishes only sourced and dated comparisons", () => { expect(publishedComparisons.length).toBeGreaterThan(0); for (const item of publishedComparisons) { expect(item.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(item.sourceUrls.every((url) => url.startsWith("https://"))).toBe(true); expect(item.chooseSthenoIf).toBeTruthy(); expect(item.chooseThemIf).toBeTruthy(); } });
  it("keeps Level unavailable until its intended product is verified", () => { expect(comparisons.find((item) => item.slug === "level")?.published).toBe(false); });
});
