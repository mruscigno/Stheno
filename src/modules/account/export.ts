export function csvFromRows(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const encode = (value: unknown) => {
    const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [columns.join(","), ...rows.map((row) => columns.map((column) => encode(row[column])).join(","))].join("\r\n");
}

export const exportQueries: ReadonlyArray<readonly [string, string, string]> = [
  ["profile", "profiles", "display_name,time_zone,created_at,updated_at"],
  ["preferences", "user_preferences", "unit_system,locale,created_at"],
  ["fitness_profiles", "fitness_profiles", "experience_level,available_days,session_minutes,effective_from,effective_to,created_at"],
  ["goals", "goals", "goal_type,target_value,target_unit,starts_at,ends_at,created_at"],
  ["assessments", "assessments", "id,status,started_at,completed_at,current_step_key,updated_at"],
  ["assessment_responses", "assessment_responses", "assessment_id,question_key,response_text,response_number,response_boolean,response_unit,response_value,answered_at,updated_at"],
  ["body_measurements", "body_measurements", "measurement_type,value,unit,measured_at,created_at"],
  ["personalization_profiles", "personalization_profile_snapshots", "assessment_id,profile_version,profile,provenance,safety_classification,created_at"],
  ["programs", "programs", "id,name,prescribed_at,retired_at"],
  ["program_plans", "program_prescriptions", "program_id,assessment_id,prescription,validation_result,prescribed_at"],
  ["workout_sessions", "workout_execution_sessions", "program_prescription_id,workout_key,status,original_workout,revised_workout,started_at,paused_at,completed_at,updated_at"],
  ["workout_sets", "workout_set_logs", "workout_execution_session_id,exercise_slug,set_ordinal,set_type,prescribed,load_value,load_unit,repetitions,rir,state,performed_at,updated_at"],
  ["weekly_checkins", "weekly_checkins", "week_start,weight_lb,workout_adherence,nutrition_adherence,energy,sleep,hunger,stress,soreness,difficulty,pain,schedule_changed,private_note,submitted_at"],
  ["nutrition_targets", "nutrition_targets", "calories_kcal,protein_g,carbohydrate_g,fat_g,fiber_g,hydration_ml,target_range,effective_from,effective_to,reason_code,created_at"],
  ["nutrition_preferences", "nutrition_preferences", "diet_style,allergies,dislikes,tracking_style,meals_per_day,updated_at"],
  ["activity_targets", "activity_targets", "steps_low,steps_high,cardio_sessions,cardio_minutes,intensity,effective_from,effective_to,created_at"],
  ["plan_adjustments", "plan_adjustment_requests", "intent,explicit_context,scope,starts_on,ends_on,proposal,confirmation_status,created_at,decided_at"],
  ["reassessments", "reassessments", "period_start,period_end,summary,recommendations,confirmation_status,created_at"],
];

export const csvSections = new Set(["body_measurements", "workout_sessions", "workout_sets", "weekly_checkins", "nutrition_targets", "activity_targets"]);
