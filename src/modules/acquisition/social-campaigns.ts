export const socialSources = ["facebook", "instagram", "linkedin", "reddit", "tiktok", "x", "youtube"] as const;
export type SocialSource = (typeof socialSources)[number];

export const socialCampaigns = {
  "three-days": {
    eyebrow: "A plan for the week you actually have",
    headline: "You don’t need six gym days.",
    subhead: "Tell us how many days you can consistently protect. STHENO will build your training and nutrition around them.",
  },
  "fitness-over-40": {
    eyebrow: "Train for the life you have now",
    headline: "Your 40s don’t require giving up hard training.",
    subhead: "Build around your goals, recovery, equipment, and actual schedule—not a generic age-based template.",
  },
  "progressive-overload": {
    eyebrow: "Progress without guesswork",
    headline: "Stop guessing when to add weight.",
    subhead: "Build a plan that tells you what to progress next and adjusts when performance or recovery changes.",
  },
} as const;

export type SocialCampaign = keyof typeof socialCampaigns;

export function approvedCampaign(value: string | null | undefined): SocialCampaign | null {
  return value && Object.prototype.hasOwnProperty.call(socialCampaigns, value) ? value as SocialCampaign : null;
}

export function approvedSource(value: string | null | undefined): SocialSource | null {
  return socialSources.includes(value as SocialSource) ? value as SocialSource : null;
}
