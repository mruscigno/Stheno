import { describe, expect, it } from "vitest";
import { evaluateNativeWorkoutRollout } from "./native-workout-rollout-policy";

const now = new Date("2026-10-31T12:00:00Z");
const internal = { cohort: "internal_test" as const, active: true, starts_at: "2026-10-01T00:00:00Z", ends_at: null };
const pilot = { cohort: "limited_pilot" as const, active: true, starts_at: "2026-10-01T00:00:00Z", ends_at: null };

describe("native workout rollout", () => {
  it("defaults disabled regardless of membership", () => expect(evaluateNativeWorkoutRollout("DISABLED", internal, now).enabled).toBe(false));
  it("allows only internal testers in internal mode", () => {
    expect(evaluateNativeWorkoutRollout("INTERNAL_TEST", internal, now).enabled).toBe(true);
    expect(evaluateNativeWorkoutRollout("INTERNAL_TEST", pilot, now).enabled).toBe(false);
  });
  it("allows explicit internal and pilot cohorts in limited pilot", () => {
    expect(evaluateNativeWorkoutRollout("LIMITED_PILOT", internal, now).enabled).toBe(true);
    expect(evaluateNativeWorkoutRollout("LIMITED_PILOT", pilot, now).enabled).toBe(true);
  });
  it("fails closed for public and expired membership", () => {
    expect(evaluateNativeWorkoutRollout("PUBLIC", internal, now).reason).toBe("public_prohibited");
    expect(evaluateNativeWorkoutRollout("LIMITED_PILOT", { ...pilot, ends_at: "2026-10-30T00:00:00Z" }, now).enabled).toBe(false);
  });
});
