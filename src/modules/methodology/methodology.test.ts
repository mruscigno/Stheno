import { describe, expect, it } from "vitest";
import { assessWeek, proposeAdjustment } from "@/modules/coaching/engine";
import { assessMonth } from "@/modules/monthly-review/engine";
import { generateNutritionPlan } from "@/modules/nutrition/engine";
import { coachMethodologyContext, methodologyClaims, methodologyPolicies, METHODOLOGY_VERSION } from ".";
import { formReviewRubrics, formRubricFor } from "./form-rubrics";
import { supplementById } from "./supplements";

describe("App 6A methodology registry", () => {
  it("keeps every policy versioned and linked to real claims", () => {
    const claimIds = new Set(methodologyClaims.map((claim) => claim.id));
    expect(methodologyPolicies.length).toBeGreaterThanOrEqual(6);
    for (const policy of methodologyPolicies) {
      expect(policy.version).toBe(METHODOLOGY_VERSION);
      expect(policy.evidenceClaimIds.length).toBeGreaterThan(0);
      expect(policy.evidenceClaimIds.every((id) => claimIds.has(id))).toBe(true);
    }
  });
  it("shares deterministic policy boundaries with Coach", () => {
    const context = coachMethodologyContext("nutrition");
    expect(context?.version).toBe(METHODOLOGY_VERSION);
    expect(context?.policies.map((policy) => policy.id)).toContain("NUT_ADJUSTMENT");
    expect(context?.boundary).toMatch(/Do not silently change/);
  });
});

describe("App 6A side-by-side safety fixtures", () => {
  it("preserves novice and dietary target behavior while adding traceability", () => {
    const plan = generateNutritionPlan({ weightLb: 180, goal: "lose_fat", activity: "moderate", trainingDays: 3, safetyClassification: "normal" });
    expect(plan.nutrition.calories).toBe(2300);
    expect(plan.nutrition.protein).toEqual({ low: 125, high: 180 });
    expect(plan.policyIds).toEqual(["NUT_STARTING_TARGET"]);
  });
  it("keeps low recovery ahead of calorie reduction", () => {
    const result = assessMonth({ goal: "lose_fat", currentWeightLb: 181, priorWeightLb: 181, workoutAdherence: 90, nutritionAdherence: 90, trainingPerformance: "declining", energy: 2, recovery: 1, sleep: 2, hunger: 3 }, { calories: 2300 });
    expect(result.recommended_actions[0].type).toBe("deload_recovery");
    expect(result.policyIds).toContain("MONTHLY_EVIDENCE_REVIEW");
  });
  it("blocks pain and keeps travel adaptations temporary", () => {
    expect(proposeAdjustment("pain", "week").blocked).toBe(true);
    expect(proposeAdjustment("traveling", "persistent").proposal?.scope).toBe("week");
    const week = assessWeek({ workoutAdherence: 90, energy: 4, sleep: 4, stress: 2, soreness: 2, difficulty: 3, pain: true, scheduleChanged: false }, { weights: [], weeksSinceMaterialChange: 4 });
    expect(week.action).toBe("safety_review");
  });
});

describe("supplements and App 6B rubric preparation", () => {
  it("frames supplements as optional with cautions", () => {
    expect(supplementById("creatine-monohydrate")?.whenUnnecessary).toMatch(/does not want it/);
    expect(supplementById("caffeine")?.cautions).toContain("sleep disruption");
  });
  it("ships five reviewed rubrics using existing exercise IDs", () => {
    expect(formReviewRubrics).toHaveLength(5);
    expect(formRubricFor("goblet-squat")?.reviewStatus).toBe("reviewed");
    expect(formReviewRubrics.every((rubric) => rubric.limitations.includes("cannot diagnose"))).toBe(true);
  });
});
