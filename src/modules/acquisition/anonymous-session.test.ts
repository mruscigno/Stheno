import { describe, expect, it } from "vitest";
import { hashCapability, issueCapability, toBlueprintInput, validateCompleteIntake } from "./anonymous-session";
import { intakeSteps } from "./assessment-model";

describe("anonymous assessment security", () => {
  it("issues high-entropy capabilities and stores only deterministic hashes", () => { const a=issueCapability(),b=issueCapability(); expect(a).not.toBe(b); expect(a.length).toBeGreaterThanOrEqual(40); expect(hashCapability(a)).toMatch(/^[a-f0-9]{64}$/); expect(hashCapability(a)).not.toContain(a); });
  it("rejects an incomplete assessment", () => { const result=validateCompleteIntake({goal:"strength"}); expect(result.valid).toBe(false); expect(result.missing).toContain("age"); });
  it("uses the full canonical acquisition registry", () => { expect(intakeSteps.length).toBeGreaterThan(40); expect(intakeSteps[0]?.question).toBe("What should your plan accomplish first?"); expect(intakeSteps.at(-1)?.key).toBe("context"); });
  it("normalizes imperial assessment values for the Blueprint engine",()=>{const input=toBlueprintInput({goal:"strength",experience:"new",days:3,duration:45,diet:"flexible",heightFeet:6,heightInches:0,weightLb:220});expect(input.heightCm).toBeCloseTo(182.88);expect(input.weightKg).toBeCloseTo(99.79,1);expect(input.days).toBe(3)});
});
