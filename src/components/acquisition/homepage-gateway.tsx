"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SthenoLogo } from "@/components/brand/stheno-logo";
import { usePublicAuthState } from "@/components/public/use-auth-state";
import { capture } from "@/lib/analytics/client";
import { captureFunnel } from "@/lib/analytics/funnel-client";
import { ASSESSMENT_VERSION } from "@/modules/acquisition/assessment-model";
import {
  ASSESSMENT_STORAGE,
  BLUEPRINT_STORAGE,
  GATEWAY_DISMISS_STORAGE,
  GATEWAY_VARIANT_STORAGE,
  approvedGatewayVariant,
  chooseHomepageEntry,
  readSavedAssessment,
  type GatewayVariant,
  type HomepageEntryState,
} from "@/modules/acquisition/homepage-gateway";

const choices = [
  ["fat_loss", "Lose body fat", "fat_loss"],
  ["muscle", "Build muscle", "muscle"],
  ["strength", "Get stronger", "strength"],
  ["general", "Feel fitter and healthier", "general"],
  ["performance", "Improve athletic performance", "strength"],
  ["unsure", "I’m not completely sure yet", "general"],
] as const;

function device() {
  return matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop";
}

function referrerDomain() {
  try { return document.referrer ? new URL(document.referrer).hostname : "direct"; }
  catch { return "unknown"; }
}

export function HomepageEntryGate({ children }: { children: ReactNode }) {
  const auth = usePublicAuthState();
  const router = useRouter();
  const [entry, setEntry] = useState<HomepageEntryState>("loading");
  const [variant, setVariant] = useState<GatewayVariant>("assessment_gateway_v1");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (auth === "loading") return;
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const forced = approvedGatewayVariant(params.get("gateway"));
      const stored = approvedGatewayVariant(localStorage.getItem(GATEWAY_VARIANT_STORAGE));
      const selectedVariant = forced ?? stored ?? "assessment_gateway_v1";
      localStorage.setItem(GATEWAY_VARIANT_STORAGE, selectedVariant);
      setVariant(selectedVariant);

      const until = Number(localStorage.getItem(GATEWAY_DISMISS_STORAGE) || 0);
      const assessment = readSavedAssessment(localStorage.getItem(ASSESSMENT_STORAGE));
      const next = chooseHomepageEntry({ auth, explored: until > Date.now(), assessment, hasBlueprint: Boolean(localStorage.getItem(BLUEPRINT_STORAGE)), variant: selectedVariant });
      setEntry(next);
      if (next === "member") router.replace("/app");
      if (next === "blueprint") router.replace("/blueprint");
      if (next === "gateway") {
        const properties = { gateway_variant: selectedVariant, device: device(), new_vs_returning: "new", referrer: referrerDomain() };
        capture("homepage_gateway_viewed", properties);
        void captureFunnel("homepage_gateway_viewed", properties);
      }
    });
  }, [auth, router]);

  function explore() {
    const days = Math.min(30, Math.max(7, Number(process.env.NEXT_PUBLIC_HOMEPAGE_GATEWAY_DISMISS_DAYS || 14)));
    localStorage.setItem(GATEWAY_DISMISS_STORAGE, String(Date.now() + days * 86_400_000));
    document.cookie = `stheno_homepage_gateway_dismissed=1; Max-Age=${days * 86_400}; Path=/; SameSite=Lax`;
    capture("homepage_gateway_explore_clicked", { gateway_variant: variant, device: device() });
    void captureFunnel("homepage_gateway_explore_clicked", { gateway_variant: variant, device: device() });
    setEntry("homepage");
  }

  function selectGoal(choiceId: string, goal: string) {
    if (selected) return;
    setSelected(choiceId);
    const now = new Date().toISOString();
    localStorage.setItem(ASSESSMENT_STORAGE, JSON.stringify({
      version: ASSESSMENT_VERSION,
      answers: { diet: "flexible", heightFeet: 5, heightInches: 9, goal },
      index: 1,
      review: false,
      startedAt: now,
      updatedAt: now,
    }));
    const properties = { gateway_variant: variant, goal_selected: choiceId, device: device(), new_vs_returning: "new" };
    capture("homepage_gateway_goal_selected", properties);
    capture("assessment_started", { assessment_version: ASSESSMENT_VERSION, entry: "homepage_gateway", gateway_variant: variant });
    void captureFunnel("homepage_gateway_goal_selected", properties);
    void captureFunnel("assessment_started", { assessment_version: ASSESSMENT_VERSION, entry: "homepage_gateway", gateway_variant: variant });
    window.setTimeout(() => router.push("/assessment"), 180);
  }

  function continueAssessment() {
    const properties = { gateway_variant: variant, device: device(), new_vs_returning: "returning" };
    capture("homepage_gateway_continue_clicked", properties);
    void captureFunnel("homepage_gateway_continue_clicked", properties);
    router.push("/assessment");
  }

  if (entry === "homepage") return <>{children}</>;
  if (entry === "loading" || entry === "member" || entry === "blueprint") {
    return <main className="homepage-gateway gateway-loading" aria-busy="true"><SthenoLogo /><p>Loading your STHENO experience…</p></main>;
  }
  if (entry === "continue") {
    return <main className="homepage-gateway"><div className="gateway-brand"><SthenoLogo /><p>YOUR FITNESS. HANDLED.</p><h1>A fitness plan that changes when your life does.</h1></div><section className="gateway-question"><p className="kicker">Your plan is waiting</p><h2>You’ve already started your Assessment.</h2><button className="gateway-primary" type="button" onClick={continueAssessment}>Continue my Assessment <span>→</span></button><button className="gateway-explore" type="button" onClick={explore}>Explore STHENO first <span>→</span></button></section></main>;
  }
  return (
    <main className={`homepage-gateway ${selected ? "gateway-advancing" : ""}`}>
      <div className="gateway-brand"><SthenoLogo /><p>YOUR FITNESS. HANDLED.</p><h1>A fitness plan that changes when your life does.</h1><p>Tell us what you want to accomplish. We’ll build your starting plan around your goals, schedule, experience, and real life.</p></div>
      <section className="gateway-question" aria-labelledby="gateway-question"><p className="kicker">Let’s build around you</p><h2 id="gateway-question">What are you trying to accomplish?</h2><div className="gateway-options">{choices.map(([id, label, goal]) => <button type="button" key={id} className={selected === id ? "selected" : ""} disabled={Boolean(selected)} onClick={() => selectGoal(id, goal)}><span>{label}</span><i aria-hidden="true">{selected === id ? "✓" : "→"}</i></button>)}</div><button className="gateway-explore" type="button" onClick={explore}>Explore STHENO first <span>→</span></button></section>
    </main>
  );
}
