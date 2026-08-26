export type ComparisonEntry = {
  slug: string;
  name: string;
  published: boolean;
  verifiedAt: string | null;
  sourceUrls: string[];
  bestFor: string | null;
  training: string | null;
  nutrition: string | null;
  adaptation: string | null;
  platforms: string | null;
  pricing: string | null;
  chooseThemIf: string | null;
  chooseSthenoIf: string | null;
};
const verified: ComparisonEntry[] = [
  {
    slug: "fitbod",
    name: "Fitbod",
    published: true,
    verifiedAt: "2026-08-19",
    sourceUrls: [
      "https://help.fitbod.me/hc/en-us/articles/360004904714-How-to-Subscribe-to-Fitbod",
      "https://fitbod.me/faqs/",
    ],
    bestFor:
      "People primarily seeking app-generated strength workouts and exercise tracking.",
    training:
      "Fitbod describes personalized workout recommendations, exercise tracking, progress insights, and equipment-based workout generation. STHENO connects its training plan with nutrition guidance, check-ins, and coaching decisions.",
    nutrition:
      "Fitbod's public FAQ emphasizes workout programming and tracking. STHENO includes fitness nutrition targets and guidance alongside training.",
    adaptation:
      "Fitbod says users can update their equipment list while traveling. STHENO accepts schedule and equipment context through its assessment and coaching tools.",
    platforms:
      "Fitbod is available through its website, iOS, and Android. STHENO is a responsive web experience.",
    pricing:
      "Fitbod lists $15.99 monthly or $95.99 annually on its website; prices may vary by region, promotion, or platform. STHENO is $14.99 monthly or $119 annually.",
    chooseThemIf:
      "Your priority is a workout-focused app with mobile-store availability and automated strength sessions.",
    chooseSthenoIf:
      "You want training, nutrition guidance, progress check-ins, and coaching decisions in one connected web experience.",
  },
  {
    slug: "future",
    name: "Future",
    published: true,
    verifiedAt: "2026-08-19",
    sourceUrls: ["https://www.future.co/"],
    bestFor:
      "People who want remote personal training centered on an assigned human coach.",
    training:
      "Future describes custom programming created by a coach after learning about the member's lifestyle, goals, equipment, and injury history. STHENO generates a personalized plan and provides in-product coaching and adjustment tools.",
    nutrition:
      "STHENO includes fitness nutrition targets and guidance. Future's public homepage positions its core service around remote personal training; confirm any additional services directly with Future.",
    adaptation:
      "Both services describe adapting training to personal context. Future centers this relationship on a human coach; STHENO provides a software-led coaching experience.",
    platforms:
      "Future is a remote personal-training service delivered through its product experience. STHENO is a responsive web experience.",
    pricing:
      "Future's official homepage lists $199 per month, with a promotional first month shown when verified. STHENO is $14.99 monthly or $119 annually.",
    chooseThemIf:
      "You specifically want an assigned human personal trainer and are comfortable with the higher monthly price.",
    chooseSthenoIf:
      "You want a lower-cost software-led experience connecting training, nutrition guidance, check-ins, and coaching decisions.",
  },
  {
    slug: "level",
    name: "Level",
    published: true,
    verifiedAt: "2026-08-26",
    sourceUrls: ["https://levelfit.ai/"],
    bestFor:
      "People who want an AI-led workout and nutrition plan with food tracking and unlimited AI chat.",
    training:
      "Level describes adaptive workout programming with periodized phases, progressive overload, and deloads. STHENO connects personalized training with weekly and monthly progress review, schedule repair, exercise swaps, and coaching decisions.",
    nutrition:
      "Both products include nutrition targets. Level also describes in-product food tracking; STHENO combines daily nutrition logging with adherence views, goal projection, and coaching context.",
    adaptation:
      "Level says its AI coach adapts plans based on progress. STHENO records check-ins, training performance, nutrition, recovery, and schedule changes to support visible plan adjustments.",
    platforms:
      "Level describes a progressive web app available across devices. STHENO is also a responsive web experience.",
    pricing:
      "Level lists $20 per month with a 14-day free trial. STHENO is $14.99 monthly or $119 annually, with a 14-day trial and a 30-day money-back guarantee on the first paid charge.",
    chooseThemIf:
      "You prefer Level's AI-first interface and its particular workout, nutrition, and chat workflow.",
    chooseSthenoIf:
      "You want a lower-priced connected membership with transparent progress reviews, plan-adjustment tools, a broad exercise library, and a first-charge guarantee.",
  },
];
const drafts: ComparisonEntry[] = ["ladder", "juggernautai", "betterme"].map(
  (slug) => ({
    slug,
    name: (
      {
        ladder: "Ladder",
        juggernautai: "JuggernautAI",
        betterme: "BetterMe",
      } as Record<string, string>
    )[slug],
    published: false,
    verifiedAt: null,
    sourceUrls: [],
    bestFor: null,
    training: null,
    nutrition: null,
    adaptation: null,
    platforms: null,
    pricing: null,
    chooseThemIf: null,
    chooseSthenoIf: null,
  }),
);
export const comparisons = [...verified, ...drafts];
export const publishedComparisons = comparisons.filter(
  (item) => item.published && item.verifiedAt && item.sourceUrls.length,
);
