import type { Metadata } from "next";
export const siteUrl = "https://www.sthenofitness.com";
export const defaultSocialImage = { url: "/opengraph-image", width: 1200, height: 630, alt: "STHENO Fitness — Your fitness. Handled." };
export function publicMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata { return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, siteName: "STHENO Fitness", type: "website", images: [defaultSocialImage] }, twitter: { card: "summary_large_image", title, description, images: [defaultSocialImage.url] } }; }
export function safeJsonLd(value: unknown) { return JSON.stringify(value).replaceAll("<", "\\u003c"); }
