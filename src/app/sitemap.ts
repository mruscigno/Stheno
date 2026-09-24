import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/config/env";
import { articles, pillars } from "@/modules/library/articles";
import { tools } from "@/modules/library/tools";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.sthenofitness.com";
  const staticPaths = [
    "",
    "/assessment",
    "/pricing",
    "/contact",
    "/methodology",
    "/about",
    "/author/matthew-david",
    "/editorial-standards",
    "/faq",
    "/compare",
    "/vs/fitbod",
    "/vs/future",
    "/vs/level",
    "/library",
    "/tools",
    "/exercises",
    "/insights",
    ...pillars
      .filter((pillar) => !["tools", "exercises"].includes(pillar.slug))
      .map((pillar) => `/library/${pillar.slug}`),
    ...tools.map((tool) => `/tools/${tool.slug}`),
  ];
  const db = publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  const { data } = db
    ? await db
        .from("exercises")
        .select("slug,updated_at")
        .eq("status", "production")
        .eq("review_status", "reviewed")
        .eq("public_indexable", true)
        .eq("technical_review_status", "reviewed")
        .eq("editorial_review_status", "reviewed")
        .eq("visual_review_status", "reviewed")
        .eq("production_ready", true)
        .limit(1000)
    : { data: [] };
  return [
    ...staticPaths.map((path, index) => ({
      url: `${base}${path}`,
      changeFrequency: (index ? "monthly" : "weekly") as "monthly" | "weekly",
      priority: index ? 0.7 : 1,
    })),
    ...articles.map((article) => ({ url: `${base}/insights/${article.slug}`, lastModified: new Date(article.updatedAt), changeFrequency: "monthly" as const, priority: 0.75 })),
    ...(data ?? []).map((exercise) => ({
      url: `${base}/exercises/${exercise.slug}`,
      lastModified: exercise.updated_at
        ? new Date(exercise.updated_at)
        : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
