import { selectExercise } from "./selection";
import type {
  Equipment,
  Exercise,
  ReplacementReason,
  StructuredDiff,
  SubstitutionScope,
  TrainingProfile,
  Workout,
  WorkoutConstraints,
} from "./types";
const muscleOverlap = (a: string[], b: string[]) =>
  a.filter((value) => b.includes(value));

/**
 * Family labels come from several historical import batches, so exact family
 * equality is too narrow for substitutions (for example `rdl`, `hinge`, and
 * `deadlift`). Normalize them into the training purpose a member is trying to
 * preserve before comparing movement pattern, muscles, or equipment.
 */
function trainingPurpose(exercise: Exercise) {
  const family = exercise.family.toLowerCase();
  if (exercise.pattern === "hinge" || /(rdl|deadlift|hinge|hip_extension|good_morning)/.test(family)) return "hip_hinge";
  if (exercise.pattern === "horizontal_pull" || /(row|scapular_retraction|rear_delt_row)/.test(family)) return "horizontal_row";
  if (exercise.pattern === "vertical_pull" || /(pull_up|chin_up|pulldown|vertical_pull)/.test(family)) return "vertical_pull";
  if (exercise.pattern === "squat" || /(squat|knee_extension)/.test(family)) return "squat";
  if (exercise.pattern === "lunge" || /(lunge|step_up|split_squat)/.test(family)) return "single_leg_knee_dominant";
  if (exercise.pattern === "horizontal_push" || /(bench_press|chest_press|push_up|incline_press)/.test(family)) return "horizontal_press";
  if (exercise.pattern === "vertical_push" || /(overhead_press|landmine_press|pike_press|push_press)/.test(family)) return "vertical_press";
  if (exercise.pattern === "carry" || /carry/.test(family)) return "loaded_carry";
  return family;
}
export function getSubstitutions(
  exerciseSlug: string,
  profile: TrainingProfile,
  library: Exercise[],
  equipment: Equipment[] = profile.equipment,
) {
  const original = library.find(
    (e) => e.slug === exerciseSlug,
  );
  if (!original) throw new Error("EXERCISE_NOT_FOUND");
  return library
    .filter(
      (e) =>
        e.slug !== original.slug &&
        e.reviewStatus === "reviewed" &&
        muscleOverlap(original.primaryMuscles, e.primaryMuscles).length > 0 &&
        e.requiredEquipment.every((item) => equipment.includes(item)),
    )
    .map((e) => {
      const primary =
          muscleOverlap(original.primaryMuscles, e.primaryMuscles).length /
          original.primaryMuscles.length,
        pattern = e.pattern === original.pattern ? 1 : 0,
        family = e.family === original.family ? 1 : 0,
        secondary =
          muscleOverlap(original.secondaryMuscles, e.secondaryMuscles).length /
          Math.max(1, original.secondaryMuscles.length),
        equipmentMatch =
          e.requiredEquipment.filter((item) =>
            original.requiredEquipment.includes(item),
          ).length / Math.max(1, e.requiredEquipment.length),
        fatigue = 1 - Math.abs(e.fatigueCost - original.fatigueCost) / 4,
        reps =
          1 - Math.min(1, Math.abs(e.repRange[0] - original.repRange[0]) / 10);
      const purpose = trainingPurpose(e) === trainingPurpose(original) ? 1 : 0;
      return {
        exercise: e,
        score:
          purpose * 100 +
          pattern * 40 +
          primary * 20 +
          family * 10 +
          equipmentMatch * 8 +
          secondary * 4 +
          fatigue * 3 +
          reps * 2,
        reasonCodes: [
          "PRIMARY_MUSCLE_PRESERVED",
          purpose ? "TRAINING_PURPOSE_PRESERVED" : "TRAINING_ROLE_PRESERVED",
          pattern ? "MOVEMENT_PATTERN_PRESERVED" : "MOVEMENT_PATTERN_ALTERNATIVE",
          equipmentMatch ? "EQUIPMENT_SIMILAR" : "EQUIPMENT_ALTERNATIVE",
        ],
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.exercise.slug.localeCompare(b.exercise.slug),
    );
}
export function proposeExerciseReplacement(
  workout: Workout,
  exerciseSlug: string,
  reason: ReplacementReason,
  scope: SubstitutionScope,
  profile: TrainingProfile,
  library: Exercise[],
  constraints: WorkoutConstraints = {},
) {
  const target = workout.exercises.find((e) => e.exerciseSlug === exerciseSlug);
  if (!target) throw new Error("PRESCRIPTION_NOT_FOUND");
  if (reason === "discomfort")
    return {
      replacement: null,
      scope,
      reason,
      classification: "modify" as const,
      reasonCodes: [
        "DISCOMFORT_SAFETY_ROUTE",
        "NO_DIAGNOSIS",
        "CONFIRM_REPLACEMENT",
      ],
      confirmationRequired: true,
    };
  const ranked = getSubstitutions(
    exerciseSlug,
    profile,
    library,
    constraints.availableEquipment,
  );
  if (!ranked.length) throw new Error("NO_SAFE_REPLACEMENT");
  return {
    replacement: ranked[0].exercise.slug,
    alternatives: ranked.slice(1, 4).map((x) => x.exercise.slug),
    scope,
    reason,
    classification: "normal" as const,
    reasonCodes: [...ranked[0].reasonCodes, `SCOPE_${scope.toUpperCase()}`],
    confirmationRequired: scope !== "session_only",
  };
}
export function reconstructWorkout(
  workout: Workout,
  constraints: WorkoutConstraints,
  profile: TrainingProfile,
  library: Exercise[],
): { workout: Workout; diff: StructuredDiff } {
  const budget = constraints.availableMinutes ?? profile.sessionMinutes;
  const equipment = constraints.availableEquipment ?? profile.equipment;
  const unavailable = new Set(constraints.unavailableExercises ?? []);
  const kept = [] as Workout["exercises"];
  const removed: string[] = [];
  const added: string[] = [];
  for (const item of workout.exercises) {
    const exercise = library.find(
      (e) => e.slug === item.exerciseSlug,
    )!;
    const equipmentOkay = exercise.requiredEquipment.every((e) =>
      equipment.includes(e),
    );
    if (!equipmentOkay || unavailable.has(item.exerciseSlug)) {
      const candidate = selectExercise({
        profile: { ...profile, equipment },
        pattern: exercise.pattern,
        role: item.role,
        usedSlugs: kept.map((k) => k.exerciseSlug),
        library,
        availableEquipment: equipment,
      });
      kept.push({
        ...item,
        exerciseSlug: candidate.exercise.slug,
        exerciseName: candidate.exercise.name,
        alternatives: candidate.alternatives,
        reasonCodes: [...candidate.reasonCodes, "WORKOUT_RECONSTRUCTED"],
      });
      removed.push(item.exerciseSlug);
      added.push(candidate.exercise.slug);
    } else kept.push(item);
  }
  while (
    kept.reduce((sum, e) => sum + e.estimatedMinutes, 5) > budget &&
    kept.length > 2
  ) {
    const dropIndex = kept
      .map((e, i) => ({
        i,
        priority: e.role === "primary" ? 3 : e.role === "secondary" ? 2 : 1,
      }))
      .sort((a, b) => a.priority - b.priority || b.i - a.i)[0].i;
    removed.push(kept[dropIndex].exerciseSlug);
    kept.splice(dropIndex, 1);
  }
  const rebuilt = {
    ...workout,
    estimatedMinutes: kept.reduce((sum, e) => sum + e.estimatedMinutes, 5),
    exercises: kept,
    reasonCodes: [...workout.reasonCodes, "CONSTRAINT_RECONSTRUCTION"],
  };
  return {
    workout: rebuilt,
    diff: {
      removed,
      added,
      preserved: kept
        .filter((e) => !added.includes(e.exerciseSlug))
        .map((e) => e.exerciseSlug),
      reasonCodes: [
        "PRIORITY_STIMULUS_PRESERVED",
        "TIME_BUDGET_HONORED",
        "EQUIPMENT_CONSTRAINTS_HONORED",
      ],
      confirmationRequired: true,
    },
  };
}
export function proposeScheduleAdaptation(
  workoutKeys: string[],
  unavailableOrdinals: number[],
  availableOrdinals: number[],
) {
  const proposed = workoutKeys.map((key, index) => ({
    workoutKey: key,
    originalOrdinal: index + 1,
    proposedOrdinal: availableOrdinals[index] ?? null,
    status: availableOrdinals[index] ? "moved" : "conflict",
  }));
  return {
    proposed,
    conflicts: proposed
      .filter((x) => x.status === "conflict")
      .map((x) => x.workoutKey),
    preserved: proposed
      .filter((x) => x.originalOrdinal === x.proposedOrdinal)
      .map((x) => x.workoutKey),
    reasonCodes: [
      "ORDER_PRESERVED",
      "FORCED_REST_DAYS_HONORED",
      unavailableOrdinals.length ? "SCHEDULE_DISRUPTION" : "NO_CHANGE",
    ],
    confirmationRequired: proposed.some(
      (x) => x.originalOrdinal !== x.proposedOrdinal,
    ),
  };
}
