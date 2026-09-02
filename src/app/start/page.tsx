import type { Metadata } from "next";
import { SocialLanding } from "@/components/acquisition/social-landing";
import { approvedCampaign, approvedSource } from "@/modules/acquisition/social-campaigns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Start your free fitness assessment", description: "See how STHENO would build training and nutrition around your actual life.", robots: { index: false, follow: true } };

export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (user) redirect("/app");
  const params = await searchParams;
  const one = (key: string) => typeof params[key] === "string" ? (params[key] as string).slice(0, 120) : "";
  const source = approvedSource(one("source")) ?? approvedSource(one("utm_source")) ?? "social";
  const campaign = approvedCampaign(one("campaign"));
  const touch = Object.fromEntries(["utm_source","utm_medium","utm_campaign","utm_content","utm_term","entry"].map(key=>[key.replace("utm_", ""), one(key)]).filter(([,value])=>value));
  return <SocialLanding source={source} campaign={campaign} touch={touch} />;
}
