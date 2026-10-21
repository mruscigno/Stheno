export const METHODOLOGY_VERSION = "2026.10-app6a.1";

export type EvidenceConfidence = "high" | "moderate" | "limited";

export type MethodologyClaim = {
  id: string;
  domain: "training" | "nutrition" | "supplements" | "coaching";
  statement: string;
  confidence: EvidenceConfidence;
  sourceIds: string[];
  limitations: string;
};

export const methodologyClaims: MethodologyClaim[] = [
  { id: "TRN_CONSISTENCY", domain: "training", statement: "A repeatable resistance-training plan is more useful than unnecessary complexity, and major muscle groups generally benefit from regular weekly exposure.", confidence: "high", sourceIds: ["ACSM_RT_2026"], limitations: "Frequency and volume must still fit experience, recovery, equipment, and schedule." },
  { id: "TRN_VOLUME", domain: "training", statement: "Weekly resistance-training volume is a useful programming lever, with diminishing returns and individual variation.", confidence: "moderate", sourceIds: ["ACSM_RT_2026", "SCHOENFELD_VOLUME_2017"], limitations: "Set targets are starting ranges, not a universal requirement." },
  { id: "TRN_FAILURE", domain: "training", statement: "Training to momentary failure is not required on every set for strength or hypertrophy.", confidence: "moderate", sourceIds: ["GRGIC_FAILURE_2022", "BIOLAYNE_KEYS_2023"], limitations: "Proximity to failure is difficult to measure and exercise risk differs." },
  { id: "NUT_PROTEIN", domain: "nutrition", statement: "Most healthy exercising adults can support adaptation with a practical daily protein range rather than one exact target.", confidence: "high", sourceIds: ["ISSN_PROTEIN_2017"], limitations: "Medical conditions, dietary restrictions, energy intake, and body size may require individualized professional advice." },
  { id: "NUT_ENERGY_TREND", domain: "nutrition", statement: "Calorie targets are estimates and should be adjusted only after adequate adherence and a multiweek outcome trend.", confidence: "moderate", sourceIds: ["ISSN_DIETS_2017"], limitations: "Scale weight is noisy and medical or eating-disorder concerns require qualified care." },
  { id: "SUP_CREATINE", domain: "supplements", statement: "Creatine monohydrate can improve high-intensity exercise capacity and training adaptation for many healthy adults.", confidence: "high", sourceIds: ["ISSN_CREATINE_2017"], limitations: "It is optional; pregnancy, kidney disease, medications, or other clinical concerns warrant clinician review." },
  { id: "SUP_CAFFEINE", domain: "supplements", statement: "Caffeine may improve exercise performance, but response and side effects vary.", confidence: "high", sourceIds: ["ISSN_CAFFEINE_2021"], limitations: "Sleep, anxiety, cardiovascular concerns, pregnancy, medications, and total daily intake matter." },
  { id: "COACH_MIN_CHANGE", domain: "coaching", statement: "Plan changes should use the minimum effective adjustment supported by adherence, performance, and recovery evidence.", confidence: "moderate", sourceIds: ["ACSM_RT_2026", "BIOLAYNE_PHAT"], limitations: "No-change can be the correct decision; pain and medical concerns supersede optimization." },
];

export const methodologySources = [
  { id: "ACSM_RT_2026", title: "Resistance Training Guidelines Update", organization: "American College of Sports Medicine", year: 2026, url: "https://acsm.org/resistance-training-guidelines-update-2026/", kind: "position-stand-summary" },
  { id: "ISSN_PROTEIN_2017", title: "International Society of Sports Nutrition Position Stand: protein and exercise", organization: "ISSN", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28642676/", doi: "10.1186/s12970-017-0177-8", kind: "position-stand" },
  { id: "ISSN_DIETS_2017", title: "International Society of Sports Nutrition position stand: diets and body composition", organization: "ISSN", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28630601/", doi: "10.1186/s12970-017-0174-y", kind: "position-stand" },
  { id: "ISSN_CREATINE_2017", title: "International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation", organization: "ISSN", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28615996/", doi: "10.1186/s12970-017-0173-z", kind: "position-stand" },
  { id: "ISSN_CAFFEINE_2021", title: "International society of sports nutrition position stand: caffeine and exercise performance", organization: "ISSN", year: 2021, url: "https://pubmed.ncbi.nlm.nih.gov/33388079/", doi: "10.1186/s12970-020-00383-4", kind: "position-stand" },
  { id: "SCHOENFELD_VOLUME_2017", title: "Dose-response relationship between weekly resistance training volume and increases in muscle mass", organization: "Journal of Sports Sciences", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/27433992/", doi: "10.1080/02640414.2016.1210197", kind: "systematic-review" },
  { id: "GRGIC_FAILURE_2022", title: "Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy", organization: "Journal of Sport and Health Science", year: 2022, url: "https://pubmed.ncbi.nlm.nih.gov/33497853/", doi: "10.1016/j.jshs.2021.01.007", kind: "systematic-review" },
  { id: "BIOLAYNE_PHAT", title: "PHAT: Power Hypertrophy Adaptive Training", organization: "BioLayne", year: 2020, url: "https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/", kind: "public-expert-perspective" },
  { id: "BIOLAYNE_KEYS_2023", title: "Keys to Building Muscle Part 1: Training", organization: "BioLayne", year: 2023, url: "https://biolayne.com/podcasts/dr-layne-norton-podcast/keys-to-building-muscle-part-1-training-episode-17/", kind: "public-expert-perspective" },
  { id: "STOPPANI_PERIODIZATION", title: "Periodization for Greater Muscle Size and Strength", organization: "Jim Stoppani", year: 2023, url: "https://www.jimstoppani.com/training/periodization", kind: "public-expert-perspective" },
  { id: "MATTHEWS_PROGRESSIVE_OVERLOAD", title: "Progressive Overload: The Key to Getting Stronger", organization: "Legion Athletics", year: 2024, url: "https://legionathletics.com/progressive-overload/", kind: "public-expert-perspective" },
] as const;

export function claimById(id: string) {
  return methodologyClaims.find((claim) => claim.id === id);
}
