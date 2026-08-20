import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const home = readFileSync(`${root}/src/app/page.tsx`, "utf8");
const pricing = readFileSync(`${root}/src/app/pricing/page.tsx`, "utf8");
const assessment = readFileSync(`${root}/src/components/acquisition/free-assessment.tsx`, "utf8");
const blueprint = readFileSync(`${root}/src/components/acquisition/blueprint-result.tsx`, "utf8");
const catalog = JSON.parse(readFileSync(`${root}/content/exercises/canonical-exercises.json`, "utf8"));
const specs = JSON.parse(readFileSync(`${root}/content/exercises/motion-specs.json`, "utf8"));

describe("Product 17 positioning and exercise gates", () => {
  it("uses the adaptation wedge throughout the funnel", () => {
    for (const source of [home, pricing, assessment, blueprint]) {
      expect(source).toContain("changes when your life does");
    }
    expect(home).toContain("You do the work. STHENO handles the plan.");
    expect(home).toContain("Your fitness. Handled.");
  });

  it("demonstrates all five real-life product-proof scenarios", () => {
    for (const proof of ["25 minutes", "hotel gym", "cable station", "missed Tuesday", "No change needed"]) {
      expect(home.toLowerCase()).toContain(proof.toLowerCase());
    }
    expect(home).not.toMatch(/10,000 members|4\.9 stars|before.and.after transformation/i);
  });

  it("keeps all 330 exercises on the Product 17 renderer", () => {
    expect(catalog).toHaveLength(330);
    expect(specs).toHaveLength(330);
    expect(new Set(specs.map((spec: { slug: string }) => spec.slug)).size).toBe(330);
    expect(specs.every((spec: { renderVersion: string }) => spec.renderVersion === "stheno-3d-2.0.0")).toBe(true);
  });
});
