import type { SocialPlatform } from "./config";

type ArticleCaptionSource = { title: string; thesis: string; pillar: string; slug: string };
const domain = "https://www.sthenofitness.com";

function hashtags(pillar: string) {
  const topic = pillar === "muscle-strength" ? "StrengthTraining" : pillar.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
  return [`#${topic}`, "#FitnessEducation", "#STHENOFitness"];
}

export function articleCaption(article: ArticleCaptionSource, platform: SocialPlatform) {
  const url = `${domain}/insights/${article.slug}`;
  if (platform === "instagram_post" || platform === "instagram_story") return `${article.title}\n\n${article.thesis}\n\nRead the full guide at the link in bio.\n\n${hashtags(article.pillar).join(" ")}`;
  if (platform === "x") return `${article.title}\n\n${article.thesis} ${url}`;
  if (platform === "linkedin") return `${article.title}\n\nA useful fitness decision starts with context, not hype. ${article.thesis}\n\nRead the practical guide: ${url}`;
  if (platform === "facebook") return `${article.title}\n\n${article.thesis}\n\nHere’s the practical reasoning and what to do next: ${url}`;
  return `${article.title}\n\n${article.thesis}\n\n${url}`;
}

export function countHashtags(value: string) { return value.match(/#[A-Za-z0-9_]+/g)?.length ?? 0; }
