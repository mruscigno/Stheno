import { describe, expect, it } from "vitest";
import { calculateEstimated1RM, calculateMuscleContributions, calculateSetVolume, evaluatePersonalRecords, normalizeLoad, recommendLoad, summarizeWorkoutDeterministically, type ExerciseIntelligenceMetadata, type IntelligenceSet } from ".";

const meta: ExerciseIntelligenceMetadata = { exerciseSlug: "bench", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "shoulders"], equipment: ["barbell"], increment: 5, e1rmEligible: true, volumeComparable: true };
const set = (overrides: Partial<IntelligenceSet> = {}): IntelligenceSet => ({ exerciseSlug: "bench", load: 185, unit: "lb", reps: 8, rir: 2, setType: "working", state: "completed", sessionId: "a", ...overrides });

describe("training intelligence", () => {
  it("calculates Epley without internal rounding", () => expect(calculateEstimated1RM({ load: 200, reps: 5 }).value).toBeCloseTo(233.3333333));
  it("rejects invalid and over-cap e1RM inputs", () => { expect(calculateEstimated1RM({ load: 0, reps: 5 }).value).toBeNull(); expect(calculateEstimated1RM({ load: 200, reps: 13 }).value).toBeNull(); expect(calculateEstimated1RM({ load: 200, reps: 5, eligible: false }).value).toBeNull(); });
  it("normalizes lb and kg", () => expect(normalizeLoad(100, "kg", "lb")).toBeCloseTo(220.462, 2));
  it("calculates comparable working-set volume", () => { expect(calculateSetVolume(set()).value).toBe(1480); expect(calculateSetVolume(set({ setType: "warmup" })).value).toBeNull(); });
  it("does not fabricate a first-session load", () => expect(recommendLoad({ prescription: { repMin: 6, repMax: 8, requiredSets: 3, unit: "lb" }, recentSets: [], metadata: meta }).load).toBeNull());
  it("increases one equipment increment after top-range easy work", () => { const result = recommendLoad({ prescription: { repMin: 6, repMax: 8, requiredSets: 3, unit: "lb", targetRir: 2 }, recentSets: [set(), set(), set()], metadata: meta }); expect(result.load).toBe(190); expect(result.reasonCode).toBe("TOP_RANGE_EASY_INCREASE"); });
  it("holds load inside the target range", () => expect(recommendLoad({ prescription: { repMin: 6, repMax: 8, requiredSets: 3, unit: "lb", targetRir: 2 }, recentSets: [set({ reps: 7 }), set({ reps: 7 }), set({ reps: 6 })], metadata: meta }).load).toBe(185));
  it("reduces after missed reps", () => expect(recommendLoad({ prescription: { repMin: 6, repMax: 8, requiredSets: 3, unit: "lb" }, recentSets: [set({ reps: 4 }), set({ reps: 5 }), set({ reps: 6 })], metadata: meta }).load).toBe(180));
  it("respects simple hard feedback", () => expect(recommendLoad({ prescription: { repMin: 6, repMax: 8, requiredSets: 3, unit: "lb" }, recentSets: [set(), set(), set()], metadata: meta, sessionEffort: "very_hard" }).reasonCode).toBe("HARD_EFFORT_REDUCE"));
  it("suppresses progression during deload", () => expect(recommendLoad({ prescription: { repMin: 6, repMax: 8, requiredSets: 3, unit: "lb", deload: true }, recentSets: [set(), set(), set()], metadata: meta }).reasonCode).toBe("DELOAD_HOLD"));
  it("uses reps-only guidance for bodyweight", () => expect(recommendLoad({ prescription: { repMin: 8, repMax: 12, requiredSets: 3, unit: "lb" }, recentSets: [set({ load: 0 })], metadata: { ...meta, bodyweightOnly: true } }).reasonCode).toBe("BODYWEIGHT_REPS_ONLY"));
  it("detects weight, rep, e1RM and volume PRs", () => expect(evaluatePersonalRecords([set({ load: 180, reps: 7 })], set({ id: "new" }), meta).map(p => p.type)).toEqual(["load", "reps_at_load", "estimated_1rm", "exercise_volume"]));
  it("ignores warm-ups for PRs", () => expect(evaluatePersonalRecords([], set({ setType: "warmup" }), meta)).toEqual([]));
  it("compares equivalent loads across units", () => expect(evaluatePersonalRecords([set({ load: 100, unit: "kg" })], set({ load: 220, unit: "lb" }), meta).some(p => p.type === "load")).toBe(false));
  it("weights primary and secondary muscle workload", () => expect(calculateMuscleContributions(meta, [set(), set(), set()]).contributions).toEqual({ chest: 3, triceps: 1.5, shoulders: 1.5 }));
  it("excludes warm-ups from workload", () => expect(calculateMuscleContributions(meta, [set({ setType: "warmup" }), set()]).validSets).toBe(1));
  it("builds a deterministic completion summary", () => expect(summarizeWorkoutDeterministically({ startedAt: "2026-01-01T10:00:00Z", completedAt: "2026-01-01T11:00:00Z", prescribedSets: 4, sets: [set(), set(), set()], prs: [], effort: "about_right" })).toMatchObject({ durationSeconds: 3600, completedSets: 3, adherencePercent: 75, effort: "about_right" }));
});
