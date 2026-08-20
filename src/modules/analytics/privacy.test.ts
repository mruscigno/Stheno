import { describe, expect, it } from "vitest";
import { safeAnalyticsProperties } from "./privacy";

describe("analytics privacy boundary", () => {
  it("drops sensitive and unbounded text while retaining funnel metadata", () => {
    expect(safeAnalyticsProperties({
      step: 3,
      plan: "monthly",
      medical_answer: "private",
      free_text: "private",
      note: "private",
      label: "x".repeat(121),
    })).toEqual({ step: 3, plan: "monthly" });
  });
});
