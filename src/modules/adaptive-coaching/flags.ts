export const adaptiveFeatureFlags = {
  blockContext: true,
  coachingSnapshot: true,
  adaptiveVolume: true,
  recoveryStatus: true,
  adjustToday: true,
  scheduleRepair: true,
  guidedMode: true,
  coachEvents: true,
} as const;
export type AdaptiveFeature = keyof typeof adaptiveFeatureFlags;
export function isAdaptiveFeatureEnabled(feature: AdaptiveFeature) {
  return adaptiveFeatureFlags[feature];
}
