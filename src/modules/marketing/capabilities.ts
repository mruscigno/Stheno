export type CapabilityStatus =
  "LIVE" | "FLAGGED" | "IN_DEVELOPMENT" | "PLANNED";
export const marketingCapabilities = {
  adaptiveLoadRecommendations: "LIVE",
  enhancedWorkoutLogger: "LIVE",
  prDetection: "LIVE",
  muscleWorkload: "LIVE",
  nutritionTracking: "LIVE",
  foodSearch: "LIVE",
  savedRecentMeals: "FLAGGED",
  photoMealEstimation: "PLANNED",
  barcode: "PLANNED",
  bodyTrends: "LIVE",
  goalProjection: "LIVE",
  coachProgressContext: "LIVE",
  travelAdjustments: "LIVE",
  swaps: "LIVE",
  progressPhotos: "LIVE",
  monthlyCheckins: "LIVE",
} as const satisfies Record<string, CapabilityStatus>;
export type MarketingCapability = keyof typeof marketingCapabilities;
export const isLive = (capability: MarketingCapability) =>
  marketingCapabilities[capability] === "LIVE";
