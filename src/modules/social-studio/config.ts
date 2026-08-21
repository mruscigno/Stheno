export const socialPlatforms = {
  instagram_post: { label: "Instagram Post", width: 1080, height: 1350, openUrl: "https://www.instagram.com/" },
  instagram_story: { label: "Instagram Story", width: 1080, height: 1920, openUrl: "https://www.instagram.com/" },
  x: { label: "X", width: 1600, height: 900, openUrl: "https://x.com/intent/post" },
  linkedin: { label: "LinkedIn", width: 1200, height: 627, openUrl: "https://www.linkedin.com/sharing/share-offsite/" },
  facebook: { label: "Facebook", width: 1200, height: 627, openUrl: "https://www.facebook.com/sharer/sharer.php" },
  square: { label: "Square", width: 1080, height: 1080, openUrl: "" },
} as const;

export const socialTemplates = [
  { id: "editorial-hero", label: "Editorial Hero" },
  { id: "bold-headline", label: "Bold Headline" },
  { id: "key-takeaway", label: "Key Takeaway" },
  { id: "fitness-split", label: "Fitness Image + Split Layout" },
  { id: "story-cover", label: "Story Cover" },
] as const;

export type SocialPlatform = keyof typeof socialPlatforms;
export type SocialTemplate = typeof socialTemplates[number]["id"];

export function isSocialPlatform(value: string): value is SocialPlatform { return value in socialPlatforms; }
export function isSocialTemplate(value: string): value is SocialTemplate { return socialTemplates.some((item) => item.id === value); }

export function safeImageUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}
