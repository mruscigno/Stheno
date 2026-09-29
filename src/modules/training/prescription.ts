export type ExercisePrescription = {
  movement_type?: string | null;
  rep_min?: number | null; rep_max?: number | null;
  duration_min_seconds?: number | null; duration_max_seconds?: number | null;
  distance_min?: number | string | null; distance_max?: number | string | null; distance_unit?: string | null;
  interval_work_seconds?: number | null; interval_recovery_seconds?: number | null;
  interval_rounds_min?: number | null; interval_rounds_max?: number | null;
};

export function formatExercisePrescription(e:ExercisePrescription){
  switch(e.movement_type){
    case "TIMED_ISOMETRIC":case "LOADED_CARRY_TIME":case "CARDIO_TIME":case "MOBILITY_TIME":return `${e.duration_min_seconds}–${e.duration_max_seconds} seconds`;
    case "LOADED_CARRY_DISTANCE":case "CARDIO_DISTANCE":return `${e.distance_min}–${e.distance_max} ${e.distance_unit}`;
    case "CARDIO_INTERVAL":return `${e.interval_work_seconds}s work / ${e.interval_recovery_seconds}s recovery · ${e.interval_rounds_min}–${e.interval_rounds_max} rounds`;
    default:return `${e.rep_min}–${e.rep_max} reps`;
  }
}
