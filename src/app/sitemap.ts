import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { articles, pillars } from "@/modules/library/articles";
import { tools } from "@/modules/library/tools";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.sthenofitness.com";
  const staticPaths = ["", "/assessment", "/pricing", "/contact", "/methodology", "/about", "/faq", "/compare", "/vs/fitbod", "/vs/future", "/library", "/tools", "/exercises", "/insights", ...pillars.filter((pillar)=>!["tools","exercises"].includes(pillar.slug)).map((pillar)=>`/library/${pillar.slug}`), ...tools.map((tool)=>`/tools/${tool.slug}`), ...articles.map((article)=>`/insights/${article.slug}`)];
  const db = await createSupabaseServerClient();
  const { data } = db ? await db.from("exercises").select("slug,updated_at").eq("status","production").eq("review_status","reviewed").limit(500) : { data: [] };
  return [...staticPaths.map((path,index)=>({url:`${base}${path}`,changeFrequency:(index?"monthly":"weekly") as "monthly"|"weekly",priority:index ? 0.7 : 1})),...(data??[]).map((exercise)=>({url:`${base}/exercises/${exercise.slug}`,lastModified:exercise.updated_at?new Date(exercise.updated_at):undefined,changeFrequency:"yearly" as const,priority:.6}))];
}
