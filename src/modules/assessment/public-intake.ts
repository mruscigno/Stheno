import type { Intake } from "@/modules/acquisition/assessment-model";
import type { AssessmentAnswers } from "./profile";

const goalMap = { strength: "build_strength", muscle: "build_muscle", fat_loss: "lose_fat", general: "general_fitness" } as const;

export function publicIntakeToAssessment(input: Intake): AssessmentAnswers {
  const equipment = Array.isArray(input.equipment) ? input.equipment.filter((item) => item !== "cardio") : [];
  const sleepHours = Number(input.sleepHours ?? 7);
  return {
    primary_goal: goalMap[input.goal as keyof typeof goalMap] ?? "general_fitness",
    secondary_goals: input.secondaryGoal && input.secondaryGoal !== "none" ? [String(input.secondaryGoal)] : [],
    experience: input.experience === "consistent" ? "intermediate" : input.experience === "returning" ? "beginner" : "new",
    recent_consistency: input.consistencyHistory === "steady" ? "very_consistent" : input.consistencyHistory === "seasonal" ? "most_weeks" : input.consistencyHistory === "intermittent" ? "inconsistent" : "none",
    days_per_week: Number(input.days ?? 3),
    preferred_days: Array.isArray(input.preferredDays) ? input.preferredDays : [],
    session_minutes: Number(input.duration ?? 45),
    environment: input.location === "mixed" ? "both" : input.location === "hotel" ? "other" : String(input.location ?? "gym"),
    equipment: equipment.length ? equipment : ["bodyweight"],
    enjoy: String(input.preferences ?? ""), dislike: String(input.dislikes ?? ""),
    movement_limits: String(input.limitations ?? ""), pain_context: String(input.limitations ?? ""),
    height: Number(input.heightFeet ?? 5) * 12 + Number(input.heightInches ?? 9), weight: Number(input.weightLb ?? 165),
    activity: String(input.activity ?? "moderate"),
    sleep: sleepHours < 6 ? "under_6" : sleepHours < 7 ? "6_7" : sleepHours < 8 ? "7_8" : "over_8",
    cardio: input.currentFrequency ? String(input.currentFrequency) : "", diet: String(input.diet ?? "flexible"),
    tracking_comfort: input.tracking === "full" ? "experienced" : input.tracking === "short" ? "comfortable" : input.tracking === "portions" ? "open" : "not_interested",
    timeframe: String(input.timeframe ?? ""),
    free_context: [input.context, input.specificOutcome, input.workedBefore].filter(Boolean).join(" "),
  };
}
