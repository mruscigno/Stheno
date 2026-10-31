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

export function canOpenNativeWorkout(input: {
  rolloutEnabled: boolean;
  authenticatedOffline: boolean;
  hasPersistedWorkout: boolean;
}) {
  return input.rolloutEnabled
    || (input.authenticatedOffline && input.hasPersistedWorkout);
}
