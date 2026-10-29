export function shouldAutoStartWorkout(input: {
  hasWorkout: boolean;
  hasFallback: boolean;
  observedWorkout: boolean;
  autoStartAttempted: boolean;
}) {
  return !input.hasWorkout
    && input.hasFallback
    && !input.observedWorkout
    && !input.autoStartAttempted;
}
