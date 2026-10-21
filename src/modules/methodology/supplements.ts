export const supplementGuidance = [
  { id: "creatine-monohydrate", benefit: "May improve repeated high-intensity performance and support training adaptation.", magnitude: "small-to-moderate average benefit", uncertainty: "Individual response varies; scale weight may rise from water stored in muscle.", appropriateFor: "Healthy adults who want an optional, well-studied performance aid.", cautions: ["kidney disease or concern", "pregnancy/breastfeeding", "medication or clinician-directed restrictions"], whenUnnecessary: "When the member does not want it, expects it to replace training/nutrition, or has no relevant performance goal.", claimIds: ["SUP_CREATINE"] },
  { id: "caffeine", benefit: "May improve alertness and some endurance or high-intensity performance.", magnitude: "small-to-moderate average benefit", uncertainty: "Tolerance and response vary substantially.", appropriateFor: "Adults who already tolerate caffeine and can protect sleep.", cautions: ["sleep disruption", "anxiety", "cardiovascular concern", "pregnancy", "medication interactions", "high total daily intake"], whenUnnecessary: "When sleep, anxiety, side effects, preference, or late-day training make the tradeoff poor.", claimIds: ["SUP_CAFFEINE"] },
] as const;

export function supplementById(id: string) {
  return supplementGuidance.find((item) => item.id === id);
}
