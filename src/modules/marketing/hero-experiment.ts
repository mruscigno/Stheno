export const HOMEPAGE_HERO_EXPERIMENT_ID = "homepage_icp_positioning_2026_08";

export const homepageHeroVariants = {
  structure:
    "Personalized fitness coaching for people who want structure without a personal trainer.",
  budget:
    "Personalized fitness coaching that works with your life and your budget.",
} as const;

export type HomepageHeroVariant = keyof typeof homepageHeroVariants;

export function activeHomepageHeroVariant(): HomepageHeroVariant {
  return process.env.NEXT_PUBLIC_HOMEPAGE_HERO_VARIANT === "budget"
    ? "budget"
    : "structure";
}
