export const ADAPTIVE_LOAD_VERSION = "adaptive_load_v1";
export const E1RM_VERSION = "epley_v1";
export const PR_VERSION = "pr_v1";
export const WORKLOAD_VERSION = "set_equivalent_v1";
export const SUMMARY_VERSION = "workout_summary_v1";

export type LoadUnit = "lb" | "kg";
export type SetType = "warmup" | "working" | "backoff" | "drop" | "failure" | "optional";
export type SessionEffort = "too_easy" | "about_right" | "very_hard" | "couldnt_finish";
export type RecommendationConfidence = "high" | "medium" | "low";
export type RecommendationReason =
  | "FIRST_SESSION_NO_HISTORY"
  | "TOP_RANGE_EASY_INCREASE"
  | "TOP_RANGE_TARGET_HOLD"
  | "MID_RANGE_TARGET_HOLD"
  | "BELOW_RANGE_REDUCE"
  | "HARD_EFFORT_REDUCE"
  | "USER_REPORTED_TOO_EASY"
  | "USER_REPORTED_VERY_HARD"
  | "DELOAD_HOLD"
  | "BODYWEIGHT_REPS_ONLY"
  | "INVALID_HISTORY";

export interface IntelligenceSet {
  id?: string;
  exerciseSlug: string;
  load: number;
  unit: LoadUnit;
  reps: number;
  rir?: number | null;
  rpe?: number | null;
  setType: SetType;
  state: "completed" | "skipped";
  sessionId?: string;
  performedAt?: string;
}

export interface ExerciseIntelligenceMetadata {
  exerciseSlug: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  bodyweightOnly?: boolean;
  volumeComparable?: boolean;
  e1rmEligible?: boolean;
  increment?: number;
}

export interface LoadPrescription {
  repMin: number;
  repMax: number;
  targetRir?: number | null;
  requiredSets: number;
  currentLoad?: number | null;
  unit: LoadUnit;
  deload?: boolean;
  suppressProgression?: boolean;
}

export interface LoadRecommendation {
  load: number | null;
  unit: LoadUnit;
  repsMin: number;
  repsMax: number;
  confidence: RecommendationConfidence;
  reasonCode: RecommendationReason;
  algorithmVersion: typeof ADAPTIVE_LOAD_VERSION;
  explanation: string;
  evidence: Record<string, unknown>;
}

const LB_PER_KG = 2.2046226218;
export function normalizeLoad(load: number, unit: LoadUnit, target: LoadUnit = "lb") {
  if (!Number.isFinite(load) || load < 0) return null;
  if (unit === target) return load;
  return target === "lb" ? load * LB_PER_KG : load / LB_PER_KG;
}

export function calculateEstimated1RM(input: { load: number; reps: number; eligible?: boolean; maxReps?: number }) {
  const maxReps = input.maxReps ?? 12;
  if (input.eligible === false) return { value: null, formula: "epley", version: E1RM_VERSION, reason: "INELIGIBLE_EXERCISE" } as const;
  if (!Number.isFinite(input.load) || input.load <= 0 || !Number.isInteger(input.reps) || input.reps < 1 || input.reps > maxReps)
    return { value: null, formula: "epley", version: E1RM_VERSION, reason: "INVALID_INPUT" } as const;
  return { value: input.load * (1 + input.reps / 30), formula: "epley", version: E1RM_VERSION, reason: "ELIGIBLE" } as const;
}

export function calculateSetVolume(set: IntelligenceSet, comparable = true) {
  if (!comparable || set.state !== "completed" || set.setType === "warmup" || set.load <= 0 || set.reps < 1)
    return { value: null, scope: "not_comparable" } as const;
  return { value: set.load * set.reps, scope: "within_exercise" } as const;
}

function validWorking(sets: IntelligenceSet[]) {
  return sets.filter(s => s.state === "completed" && s.setType !== "warmup" && s.load >= 0 && s.reps > 0 && s.reps <= 500);
}

function roundToIncrement(value: number, increment: number) {
  return Math.max(0, Math.round(value / increment) * increment);
}

export function recommendLoad(input: {
  prescription: LoadPrescription;
  recentSets: IntelligenceSet[];
  metadata: ExerciseIntelligenceMetadata;
  sessionEffort?: SessionEffort | null;
}): LoadRecommendation {
  const { prescription: p, metadata } = input;
  const base = { unit: p.unit, repsMin: p.repMin, repsMax: p.repMax, algorithmVersion: ADAPTIVE_LOAD_VERSION } as const;
  if (metadata.bodyweightOnly)
    return { ...base, load: null, confidence: "low", reasonCode: "BODYWEIGHT_REPS_ONLY", explanation: `Aim for ${p.repMin}–${p.repMax} controlled reps.`, evidence: {} };
  const history = validWorking(input.recentSets).slice(0, 12);
  if (!history.length)
    return { ...base, load: null, confidence: "low", reasonCode: "FIRST_SESSION_NO_HISTORY", explanation: "Choose a weight you can control for the full rep range. Complete another workout to unlock a personalized recommendation.", evidence: { comparableSets: 0 } };
  const currentLoad = p.currentLoad ?? history[0].load;
  if (!Number.isFinite(currentLoad) || currentLoad <= 0)
    return { ...base, load: null, confidence: "low", reasonCode: "INVALID_HISTORY", explanation: "Choose a comfortable starting weight for the full rep range.", evidence: { comparableSets: history.length } };
  const increment = metadata.increment ?? (metadata.equipment.includes("dumbbells") ? 5 : metadata.equipment.includes("barbell") ? 5 : 5);
  const sessionSets = history.filter(s => s.sessionId === history[0].sessionId || !history[0].sessionId).slice(0, p.requiredSets);
  const allComplete = sessionSets.length >= p.requiredSets;
  const topRange = allComplete && sessionSets.every(s => s.reps >= p.repMax);
  const belowRange = sessionSets.filter(s => s.reps < p.repMin).length >= Math.max(1, Math.ceil(p.requiredSets / 2));
  const averageRir = sessionSets.some(s => s.rir != null) ? sessionSets.reduce((n, s) => n + (s.rir ?? p.targetRir ?? 2), 0) / sessionSets.length : null;
  const easy = input.sessionEffort === "too_easy" || (averageRir != null && averageRir >= (p.targetRir ?? 2));
  const hard = input.sessionEffort === "very_hard" || input.sessionEffort === "couldnt_finish" || (averageRir != null && averageRir <= 0.5);
  const confidence: RecommendationConfidence = new Set(history.map(s => s.sessionId).filter(Boolean)).size >= 2 && averageRir != null ? "high" : history.length >= p.requiredSets ? "medium" : "low";
  const evidence = { comparableSets: history.length, lastLoad: currentLoad, allComplete, topRange, belowRange, averageRir };
  if (p.deload || p.suppressProgression)
    return { ...base, load: currentLoad, confidence, reasonCode: "DELOAD_HOLD", explanation: `Stay at ${currentLoad} ${p.unit} while this recovery-focused week is active.`, evidence };
  if (hard || belowRange) {
    const load = roundToIncrement(currentLoad - increment, increment);
    return { ...base, load, confidence, reasonCode: hard ? "HARD_EFFORT_REDUCE" : "BELOW_RANGE_REDUCE", explanation: `Last time was harder than planned. Try ${load} ${p.unit} and keep the reps controlled.`, evidence };
  }
  if (topRange && easy) {
    const load = roundToIncrement(currentLoad + increment, increment);
    return { ...base, load, confidence, reasonCode: input.sessionEffort === "too_easy" ? "USER_REPORTED_TOO_EASY" : "TOP_RANGE_EASY_INCREASE", explanation: `You reached the top of the rep range with reps left. Try ${load} ${p.unit} today.`, evidence };
  }
  return { ...base, load: currentLoad, confidence, reasonCode: topRange ? "TOP_RANGE_TARGET_HOLD" : "MID_RANGE_TARGET_HOLD", explanation: `Stay at ${currentLoad} ${p.unit} and build toward ${p.repMax} controlled reps.`, evidence };
}

export type PRType = "load" | "reps_at_load" | "estimated_1rm" | "exercise_volume";
export interface PRCandidate { type: PRType; value: number; secondaryValue?: number; sourceSetId?: string; algorithmVersion: typeof PR_VERSION }

export function evaluatePersonalRecords(history: IntelligenceSet[], candidate: IntelligenceSet, metadata: ExerciseIntelligenceMetadata) {
  if (candidate.state !== "completed" || candidate.setType === "warmup" || candidate.load < 0 || candidate.reps < 1 || candidate.reps > 500) return [];
  const prior = validWorking(history).filter(s => s.exerciseSlug === candidate.exerciseSlug);
  const normalizedCandidate = normalizeLoad(candidate.load, candidate.unit)!;
  const normalized = prior.map(s => ({ ...s, normalized: normalizeLoad(s.load, s.unit)! }));
  const records: PRCandidate[] = [];
  if (candidate.load > 0 && normalizedCandidate > Math.max(0, ...normalized.map(s => s.normalized)))
    records.push({ type: "load", value: candidate.load, secondaryValue: candidate.reps, sourceSetId: candidate.id, algorithmVersion: PR_VERSION });
  const sameLoad = normalized.filter(s => Math.abs(s.normalized - normalizedCandidate) < 0.01);
  if (candidate.load > 0 && candidate.reps > Math.max(0, ...sameLoad.map(s => s.reps)))
    records.push({ type: "reps_at_load", value: candidate.reps, secondaryValue: candidate.load, sourceSetId: candidate.id, algorithmVersion: PR_VERSION });
  const e1rm = calculateEstimated1RM({ load: normalizedCandidate, reps: candidate.reps, eligible: metadata.e1rmEligible !== false && !metadata.bodyweightOnly }).value;
  const priorE1rm = normalized.map(s => calculateEstimated1RM({ load: s.normalized, reps: s.reps, eligible: metadata.e1rmEligible !== false && !metadata.bodyweightOnly }).value ?? 0);
  if (e1rm != null && e1rm > Math.max(0, ...priorE1rm)) records.push({ type: "estimated_1rm", value: e1rm, sourceSetId: candidate.id, algorithmVersion: PR_VERSION });
  const volume = calculateSetVolume(candidate, metadata.volumeComparable !== false).value;
  const priorVolume = prior.map(s => calculateSetVolume(s, metadata.volumeComparable !== false).value ?? 0);
  if (volume != null && volume > Math.max(0, ...priorVolume)) records.push({ type: "exercise_volume", value: volume, sourceSetId: candidate.id, algorithmVersion: PR_VERSION });
  return records;
}

export function calculateMuscleContributions(metadata: ExerciseIntelligenceMetadata, sets: IntelligenceSet[]) {
  const completed = validWorking(sets).length;
  const contributions: Record<string, number> = {};
  for (const muscle of metadata.primaryMuscles) contributions[muscle] = (contributions[muscle] ?? 0) + completed;
  for (const muscle of metadata.secondaryMuscles) contributions[muscle] = (contributions[muscle] ?? 0) + completed * 0.5;
  return { contributions, validSets: completed, algorithmVersion: WORKLOAD_VERSION };
}

export function summarizeWorkoutDeterministically(input: { startedAt: string; completedAt: string; prescribedSets: number; sets: IntelligenceSet[]; prs: unknown[]; effort?: SessionEffort | null }) {
  const completed = validWorking(input.sets);
  const durationSeconds = Math.max(0, Math.round((Date.parse(input.completedAt) - Date.parse(input.startedAt)) / 1000));
  const totalVolume = completed.reduce((sum, set) => sum + (calculateSetVolume(set).value ?? 0), 0);
  return { durationSeconds, completedSets: completed.length, prescribedSets: input.prescribedSets, adherencePercent: Math.round(completed.length / Math.max(1, input.prescribedSets) * 100), totalVolume, prCount: input.prs.length, effort: input.effort ?? null, version: SUMMARY_VERSION };
}

export function recommendationCopy(reasonCode: RecommendationReason, load: number | null, unit: LoadUnit) {
  if (reasonCode === "FIRST_SESSION_NO_HISTORY") return "Complete another workout to unlock a personalized load recommendation.";
  if (reasonCode === "BODYWEIGHT_REPS_ONLY") return "Progress with controlled reps before adding load.";
  if (load == null) return "Choose a comfortable starting weight.";
  if (["TOP_RANGE_EASY_INCREASE", "USER_REPORTED_TOO_EASY"].includes(reasonCode)) return `You reached the top of the range with reps left. Try ${load} ${unit}.`;
  if (["BELOW_RANGE_REDUCE", "HARD_EFFORT_REDUCE", "USER_REPORTED_VERY_HARD"].includes(reasonCode)) return `Last time was harder than planned. Try ${load} ${unit}.`;
  return `Stay at ${load} ${unit} and build clean reps.`;
}
