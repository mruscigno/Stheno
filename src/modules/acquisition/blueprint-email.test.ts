import { describe, expect, it } from "vitest";
import { blueprintEmailRequestSchema, buildBlueprintEmail } from "./blueprint-email";

const request = {
  email: "person@example.com",
  marketingConsent: false,
  website: "",
  summary: { goalLabel: "Build <strength>", strategy: "Three safe sessions.", days: 3, focus: "Build strength", structure: "Three full-body sessions", duration: 45, proteinLow: 120, proteinHigh: 140, calorieDirection: "Start near maintenance" },
};

describe("Blueprint email", () => {
  it("validates a concise blueprint summary", () => {
    expect(blueprintEmailRequestSchema.safeParse(request).success).toBe(true);
  });

  it("escapes visitor-controlled content and keeps marketing optional", () => {
    const message = buildBlueprintEmail(request, "https://www.sthenofitness.com");
    expect(message.html).toContain("Build &lt;strength&gt;");
    expect(message.html).not.toContain("Build <strength>");
    expect(message.text).toContain("This delivery does not subscribe you to marketing emails.");
  });

  it("describes the separate marketing choice when granted", () => {
    const message = buildBlueprintEmail({ ...request, marketingConsent: true }, "https://www.sthenofitness.com");
    expect(message.text).toContain("You also asked to receive occasional STHENO");
  });
});
