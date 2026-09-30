import type { Metadata } from "next";
import { membership } from "@/modules/commerce/product";
export const siteUrl = "https://www.sthenofitness.com";
export const organizationId = `${siteUrl}/#organization`;
export const websiteId = `${siteUrl}/#website`;
export const authorUrl = `${siteUrl}/author/matthew-david`;
export const officialProfiles = [
  "https://www.instagram.com/sthenofitness8/",
  "https://x.com/SthenoFitness8",
  "https://www.reddit.com/user/SthenoFitness/",
  "https://www.tiktok.com/@sthenofitness?lang=en",
  "https://www.youtube.com/channel/UC737ojNjs_dTf-mc6ytZvtw",
];
export const defaultSocialImage = { url: "/opengraph-image", width: 1200, height: 630, alt: "STHENO Fitness — Your fitness. Handled." };
export function publicMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata { return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, siteName: "STHENO Fitness", type: "website", images: [defaultSocialImage] }, twitter: { card: "summary_large_image", title, description, images: [defaultSocialImage.url] } }; }
export function exercisePageTitle(name: string) {
  const candidates = [`${name} Exercise Guide | STHENO Fitness`, `${name} Guide | STHENO Fitness`, `${name} | STHENO Fitness`,`${name} | STHENO`];
  return candidates.find((title) => title.length >= 30 && title.length <= 60) ?? `${name.slice(0, 42).trimEnd()} | STHENO Fitness`;
}
export function exerciseMetaDescription(name: string) {
  const candidates=[`Learn how to perform ${name} with reviewed setup steps, coaching cues, common mistakes, target muscles, equipment, and useful alternatives.`,`Learn ${name} setup, execution, cues, mistakes, target muscles, equipment, and reviewed alternatives.`];
  return candidates.find((description)=>description.length>=110&&description.length<=160)??candidates.at(-1)!;
}
export function toolMetaDescription(summary: string, title: string) {
  const candidates=[`${summary} Use the ${title} to interpret the estimate, understand its limits, and choose a practical next step.`,`${summary} See how to interpret the result, its limits, and the next useful step.`,`${summary} Get the result, limitations, and a practical next step.`];
  return candidates.find((description)=>description.length>=110&&description.length<=160)??candidates.at(-1)!;
}
export function articleMetaDescription(thesis: string) {
  const candidates=[thesis,`${thesis} See practical examples, limits, measurements, and clear next steps.`,`${thesis} Learn the practical next steps and limits.`];
  return candidates.find((description)=>description.length>=110&&description.length<=160)??thesis;
}
const conciseArticleTitles:Record<string,string>={
  "How Fat Loss Actually Works":"How Fat Loss Actually Works: A Guide",
  "Three Days vs. Four Days vs. Five Days: How Much Should You Train?":"3 vs. 4 vs. 5 Training Days: Which Is Best?",
  "Creatine: What It Does, How Much to Take, and What It Doesn’t Do":"Creatine Guide: Benefits, Dose, and Limits",
  "How Much Does Sleep Matter for Strength, Muscle, and Fat Loss?":"Sleep for Strength, Muscle, and Fat Loss",
};
export function articlePageTitle(title:string){return conciseArticleTitles[title]??title;}
export function safeJsonLd(value: unknown) { return JSON.stringify(value).replaceAll("<", "\\u003c"); }
export function organizationJsonLd() { return { "@context": "https://schema.org", "@type": "Organization", "@id": organizationId, name: "STHENO Fitness", url: siteUrl, logo: `${siteUrl}/stheno-logo-orange.svg`, description: "Personalized training, nutrition guidance, progress tracking, and fitness coaching built around real life.", sameAs: officialProfiles }; }
export function serviceJsonLd(path = "/") { return { "@context": "https://schema.org", "@type": "Service", "@id": `${siteUrl}/#personalized-fitness-coaching`, name: "STHENO Fitness", serviceType: "Personalized fitness coaching", provider: { "@id": organizationId }, url: `${siteUrl}${path}`, description: "Personalized workouts, nutrition guidance, progress tracking, and ongoing fitness coaching built around each member's goals, schedule, experience, and equipment.", offers: [{ "@type": "Offer", price: membership.monthly.amount, priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${siteUrl}/pricing`, name: "Monthly membership" }, { "@type": "Offer", price: membership.annual.amount, priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${siteUrl}/pricing`, name: "Annual membership" }] }; }
export function breadcrumbJsonLd(items: [string, string][]) { return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], index) => ({ "@type": "ListItem", position: index + 1, name, item: `${siteUrl}${path}` })) }; }
