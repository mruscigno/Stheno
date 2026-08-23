export const trainingIntelligenceFlags = {
  calculations: process.env.TRAINING_INTELLIGENCE_CALCULATIONS !== "false",
  enhancedWorkoutLogger: process.env.NEXT_PUBLIC_ENHANCED_WORKOUT_LOGGER !== "false",
  adaptiveLoads: process.env.NEXT_PUBLIC_ADAPTIVE_LOADS !== "false",
  progressIntelligence: process.env.NEXT_PUBLIC_PROGRESS_INTELLIGENCE !== "false",
  muscleWorkload: process.env.NEXT_PUBLIC_MUSCLE_WORKLOAD !== "false",
  achievements: process.env.NEXT_PUBLIC_TRAINING_ACHIEVEMENTS !== "false",
  effortFeedback: process.env.NEXT_PUBLIC_EFFORT_FEEDBACK !== "false",
  coachContext: process.env.TRAINING_COACH_CONTEXT !== "false",
} as const;
