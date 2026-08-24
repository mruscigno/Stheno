import type {
  ProgressionContext,
  ProgressionDecision,
  ProgressionStrategy,
} from "./types";
export function resolveProgressionStrategy(
  context: ProgressionContext,
): ProgressionStrategy {
  if (context.fatigueFlag || context.consecutiveStalls >= 2) return "hold";
  if (
    context.completedReps.every((reps) => reps >= context.repMax) &&
    context.actualRir.every((rir) => rir >= context.targetRir)
  )
    return "load";
  if (context.completedReps.every((reps) => reps >= context.repMin))
    return "reps";
  return "technique";
}
export function evaluateProgression(
  context: ProgressionContext,
): ProgressionDecision {
  if (context.fatigueFlag)
    return {
      action: "deload",
      loadMultiplier: 0.9,
      strategy: "hold",
      reasonCodes: ["FATIGUE_FLAG", "DELOAD_CONSERVATIVE"],
    };
  if (
    context.actualRir.some((rir) => rir < 0) ||
    context.completedReps.some((reps) => reps < context.repMin)
  )
    return {
      action: "reduce_load",
      loadMultiplier: 0.95,
      strategy: "technique",
      reasonCodes: ["REP_FLOOR_MISSED", "TECHNIQUE_RESERVE_PROTECTED"],
    };
  if (context.consecutiveStalls >= 2)
    return {
      action: "reduce_load",
      loadMultiplier: 0.95,
      strategy: "variation",
      reasonCodes: ["PLATEAU_DETECTED", "LOAD_RESET"],
    };
  if (
    context.completedReps.every((reps) => reps >= context.repMax) &&
    context.actualRir.every((rir) => rir >= context.targetRir)
  )
    return {
      action: "increase_load",
      loadMultiplier: 1.025,
      strategy: "load",
      reasonCodes: ["REP_RANGE_ACHIEVED", "TARGET_RIR_MAINTAINED"],
    };
  if (context.completedReps.every((reps) => reps >= context.repMin))
    return {
      action: "increase_reps",
      loadMultiplier: 1,
      strategy: "reps",
      reasonCodes: ["REP_FLOOR_ACHIEVED", "DOUBLE_PROGRESSION"],
    };
  return {
    action: "hold",
    loadMultiplier: 1,
    strategy: resolveProgressionStrategy(context),
    reasonCodes: ["PERFORMANCE_INCONCLUSIVE", "HOLD_LOAD"],
  };
}
