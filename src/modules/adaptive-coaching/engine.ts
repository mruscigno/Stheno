import type {
  Prescription,
  TrainingPhase,
  Workout,
} from "@/modules/training/types";

export const ADAPTIVE_COACHING_VERSION = "2.0.0";
export const ADAPTIVE_RULESET_VERSION = "2026.08.24";

export type TrainingBalance =
  "on_plan" | "below_plan" | "above_plan" | "not_enough_data";
export type RecoveryStatus =
  "ready" | "recovering" | "recently_trained" | "fatigue_signal" | "unknown";
export type VolumeDecision =
  | "hold_volume"
  | "increase_volume"
  | "reduce_volume"
  | "deload"
  | "wait_for_more_data";

export function resolvePhase(week: number, weeks: number): TrainingPhase {
  const safeWeek = Math.max(1, Math.min(week, Math.max(1, weeks)));
  if (safeWeek === 1) return "foundation";
  if (safeWeek === weeks && weeks >= 4) return "recovery";
  const ratio = safeWeek / Math.max(1, weeks);
  if (ratio <= 0.4) return "build";
  if (ratio <= 0.7) return "progress";
  return "intensify";
}

export function evaluateTrainingBalance(
  plannedSets: number,
  completedSets: number,
): { status: TrainingBalance; reasonCodes: string[]; explanation: string } {
  if (plannedSets < 4)
    return {
      status: "not_enough_data",
      reasonCodes: ["INSUFFICIENT_PLANNED_WORK"],
      explanation:
        "Complete more planned training before STHENO labels your training balance.",
    };
  const ratio = completedSets / plannedSets;
  if (ratio < 0.72)
    return {
      status: "below_plan",
      reasonCodes: ["COMPLETED_VOLUME_BELOW_PLAN"],
      explanation:
        "Completed training is below the planned range. STHENO will first help repair the schedule rather than add work.",
    };
  if (ratio > 1.2)
    return {
      status: "above_plan",
      reasonCodes: ["COMPLETED_VOLUME_ABOVE_PLAN"],
      explanation:
        "Completed training is above the planned range. Recovery signals should be checked before adding more work.",
    };
  return {
    status: "on_plan",
    reasonCodes: ["COMPLETED_VOLUME_IN_RANGE"],
    explanation: "Completed training is close to the planned amount.",
  };
}

export function evaluateRecovery(input: {
  daysSinceTraining?: number | null;
  soreness?:
    "fully_recovered" | "little_sore" | "very_sore" | "not_sure" | null;
  hardSessions7d: number;
  decliningPerformance: boolean;
}): { status: RecoveryStatus; reasonCodes: string[]; explanation: string } {
  if (
    input.soreness === "very_sore" ||
    (input.hardSessions7d >= 3 && input.decliningPerformance)
  )
    return {
      status: "fatigue_signal",
      reasonCodes: ["PERSISTENT_FATIGUE_EVIDENCE"],
      explanation:
        "Recent soreness and training performance support reducing stress today. This is a coaching signal, not a medical measurement.",
    };
  if (input.daysSinceTraining == null && !input.soreness)
    return {
      status: "unknown",
      reasonCodes: ["RECOVERY_DATA_UNAVAILABLE"],
      explanation:
        "There is not enough recent training or recovery information to estimate readiness.",
    };
  if (input.daysSinceTraining != null && input.daysSinceTraining < 1)
    return {
      status: "recently_trained",
      reasonCodes: ["MUSCLE_RECENTLY_TRAINED"],
      explanation:
        "This area was trained recently, so today’s plan avoids unnecessary duplicate stress.",
    };
  if (input.soreness === "little_sore")
    return {
      status: "recovering",
      reasonCodes: ["MILD_SORENESS_REPORTED"],
      explanation:
        "A little soreness can be compatible with training, but STHENO keeps the recommendation conservative.",
    };
  return {
    status: "ready",
    reasonCodes: ["RECOVERY_SIGNALS_CLEAR"],
    explanation:
      "Recent training and feedback do not currently show a reason to reduce the planned work.",
  };
}

export function evaluateVolume(input: {
  observations: number;
  adherence: number | null;
  performanceTrend: "improving" | "stable" | "declining" | "unknown";
  recovery: RecoveryStatus;
}): { decision: VolumeDecision; reasonCodes: string[] } {
  if (input.observations < 3 || input.adherence == null)
    return {
      decision: "wait_for_more_data",
      reasonCodes: ["MINIMUM_OBSERVATIONS_NOT_MET"],
    };
  if (
    input.recovery === "fatigue_signal" &&
    input.performanceTrend === "declining"
  )
    return {
      decision: "deload",
      reasonCodes: ["FATIGUE_AND_PERFORMANCE_DECLINE"],
    };
  if (input.recovery === "fatigue_signal" || input.adherence < 0.65)
    return {
      decision: "reduce_volume",
      reasonCodes: [
        input.recovery === "fatigue_signal"
          ? "RECOVERY_CONSTRAINED"
          : "ADHERENCE_CONSTRAINED",
      ],
    };
  if (
    input.observations >= 4 &&
    input.adherence >= 0.85 &&
    input.performanceTrend === "improving" &&
    input.recovery === "ready"
  )
    return {
      decision: "increase_volume",
      reasonCodes: ["PERSISTENT_POSITIVE_EVIDENCE"],
    };
  return {
    decision: "hold_volume",
    reasonCodes: ["DEFAULT_HOLD_WITHOUT_PERSISTENT_EVIDENCE"],
  };
}

function valueScore(exercise: Prescription) {
  return exercise.role === "primary"
    ? 100
    : exercise.role === "secondary"
      ? 60
      : 25;
}
export function adaptWorkoutForTime(
  workout: Workout,
  availableMinutes: number,
): { workout: Workout; removed: string[]; reasonCodes: string[] } {
  const budget = Math.max(10, availableMinutes - 5),
    ranked = workout.exercises
      .map((exercise, index) => ({ exercise, index }))
      .sort(
        (a, b) =>
          valueScore(b.exercise) - valueScore(a.exercise) || a.index - b.index,
      );
  const kept: Prescription[] = [];
  let used = 0;
  for (const item of ranked)
    if (used + item.exercise.estimatedMinutes <= budget || kept.length < 2) {
      kept.push(item.exercise);
      used += item.exercise.estimatedMinutes;
    }
  kept.sort(
    (a, b) => workout.exercises.indexOf(a) - workout.exercises.indexOf(b),
  );
  const removed = workout.exercises
    .filter((item) => !kept.includes(item))
    .map((item) => item.exerciseSlug);
  return {
    workout: {
      ...workout,
      estimatedMinutes: Math.min(availableMinutes, used + 5),
      exercises: kept,
      reasonCodes: [...workout.reasonCodes, "TIME_CONSTRAINT_PRIORITIZED"],
    },
    removed,
    reasonCodes: [
      "PRIMARY_MOVEMENTS_PRESERVED",
      "LOWER_PRIORITY_WORK_REMOVED",
      `TIME_BUDGET_${availableMinutes}`,
    ],
  };
}

export function detectDurationMismatch(
  plannedMinutes: number,
  durations: number[],
): { mismatch: boolean; median: number | null; reasonCodes: string[] } {
  if (durations.length < 4)
    return {
      mismatch: false,
      median: null,
      reasonCodes: ["MINIMUM_DURATION_OBSERVATIONS_NOT_MET"],
    };
  const sorted = [...durations].sort((a, b) => a - b),
    median =
      (sorted[Math.floor((sorted.length - 1) / 2)] +
        sorted[Math.ceil((sorted.length - 1) / 2)]) /
      2;
  return {
    mismatch: median > plannedMinutes * 1.2,
    median,
    reasonCodes: [
      median > plannedMinutes * 1.2
        ? "PERSISTENT_DURATION_OVERRUN"
        : "DURATION_IN_RANGE",
    ],
  };
}

export function selectCoachEvent(
  facts: {
    pr: boolean;
    deload: boolean;
    blockComplete: boolean;
    scheduleRepair: boolean;
  },
  recentTypes: string[],
) {
  const candidates = [
    ["deload_recommended", facts.deload],
    ["block_completed", facts.blockComplete],
    ["schedule_repair_shown", facts.scheduleRepair],
    ["pr_earned", facts.pr],
  ] as const;
  const selected = candidates.find(
    ([type, active]) => active && !recentTypes.includes(type),
  );
  return selected
    ? {
        type: selected[0],
        reasonCode: `FACT_${selected[0].toUpperCase()}`,
        algorithmVersion: ADAPTIVE_RULESET_VERSION,
      }
    : null;
}
