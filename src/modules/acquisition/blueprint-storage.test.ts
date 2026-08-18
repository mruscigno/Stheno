import { describe, expect, it } from "vitest";
import { createBlueprint } from "./blueprint";
import { normalizeStoredBlueprint } from "./blueprint-storage";

const blueprint = createBlueprint({
  goal: "strength",
  experience: "new",
  days: 3,
  diet: "flexible",
});

describe("normalizeStoredBlueprint", () => {
  it("accepts the current flat storage shape", () => {
    expect(normalizeStoredBlueprint({ ...blueprint, createdAt: "now" })?.training.days).toBe(3);
  });

  it("recovers the nested Product 13 response shape", () => {
    const saved = normalizeStoredBlueprint({ blueprint, input: { goal: "strength" }, createdAt: "now" });
    expect(saved?.goalLabel).toBe("Build strength");
    expect(saved?.createdAt).toBe("now");
  });

  it("rejects corrupt or incomplete values instead of crashing the page", () => {
    expect(normalizeStoredBlueprint({ blueprint: { goalLabel: "Incomplete" } })).toBeNull();
    expect(normalizeStoredBlueprint(null)).toBeNull();
  });
});
