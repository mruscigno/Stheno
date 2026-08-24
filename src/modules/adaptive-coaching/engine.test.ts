import { describe, expect, it } from "vitest";
import {
  adaptWorkoutForTime,
  detectDurationMismatch,
  evaluateRecovery,
  evaluateTrainingBalance,
  evaluateVolume,
  resolvePhase,
  selectCoachEvent,
} from "./engine";

describe("adaptive coaching engine", () => {
  it("uses qualitative phases and a final recovery week", () => {
    expect(resolvePhase(1, 8)).toBe("foundation");
    expect(resolvePhase(8, 8)).toBe("recovery");
  });
  it("does not invent training balance without a plan", () =>
    expect(evaluateTrainingBalance(0, 0).status).toBe("not_enough_data"));
  it("defaults volume to hold until persistent evidence exists", () =>
    expect(
      evaluateVolume({
        observations: 3,
        adherence: 0.8,
        performanceTrend: "stable",
        recovery: "ready",
      }).decision,
    ).toBe("hold_volume"));
  it("deloads only when fatigue and declining performance agree", () =>
    expect(
      evaluateVolume({
        observations: 4,
        adherence: 0.9,
        performanceTrend: "declining",
        recovery: "fatigue_signal",
      }).decision,
    ).toBe("deload"));
  it("keeps recovery language qualitative", () =>
    expect(
      evaluateRecovery({
        soreness: null,
        daysSinceTraining: null,
        hardSessions7d: 0,
        decliningPerformance: false,
      }).status,
    ).toBe("unknown"));
  it("requires four duration observations", () =>
    expect(detectDurationMismatch(45, [60, 62, 64]).mismatch).toBe(false));
  it("throttles repeated coach events", () =>
    expect(
      selectCoachEvent(
        {
          pr: true,
          deload: false,
          blockComplete: false,
          scheduleRepair: false,
        },
        ["pr_earned"],
      ),
    ).toBeNull());
  it("preserves higher-value movements when time is short", () => {
    const workout = {
      key: "a",
      name: "A",
      dayOrdinal: 1,
      focus: "full",
      estimatedMinutes: 45,
      reasonCodes: [],
      exercises: [
        {
          exerciseSlug: "main",
          exerciseName: "Main",
          role: "primary" as const,
          sets: 3,
          repMin: 5,
          repMax: 8,
          rir: 2,
          restSeconds: 120,
          estimatedMinutes: 15,
          reasonCodes: [],
          alternatives: [],
        },
        {
          exerciseSlug: "accessory",
          exerciseName: "Accessory",
          role: "accessory" as const,
          sets: 3,
          repMin: 10,
          repMax: 15,
          rir: 2,
          restSeconds: 60,
          estimatedMinutes: 12,
          reasonCodes: [],
          alternatives: [],
        },
        {
          exerciseSlug: "second",
          exerciseName: "Second",
          role: "secondary" as const,
          sets: 3,
          repMin: 8,
          repMax: 12,
          rir: 2,
          restSeconds: 90,
          estimatedMinutes: 13,
          reasonCodes: [],
          alternatives: [],
        },
      ],
    };
    expect(
      adaptWorkoutForTime(workout, 25).workout.exercises.map(
        (x) => x.exerciseSlug,
      ),
    ).toEqual(["main", "second"]);
  });
});
