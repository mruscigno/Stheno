"use client";

import Link from "next/link";
import { useEffect, type MouseEvent } from "react";
import { SthenoLogo } from "@/components/brand/stheno-logo";
import { captureFunnel, rememberAttribution } from "@/lib/analytics/funnel-client";
import { socialCampaigns, type SocialCampaign } from "@/modules/acquisition/social-campaigns";

type Props = { source: string; campaign: SocialCampaign | null; touch: Record<string, string> };

export function SocialLanding({ source, campaign, touch }: Props) {
  const copy = campaign ? socialCampaigns[campaign] : {
    eyebrow: "The plan is just the beginning.",
    headline: "You don’t need another workout plan that forgets you after Day 1.",
    subhead: "STHENO builds your training and nutrition around real life—then keeps coaching what happens after missed workouts, stronger lifts, travel and check-ins.",
  };
  useEffect(() => {
    const browser = /CriOS/i.test(navigator.userAgent) ? "chrome-ios" : /FxiOS/i.test(navigator.userAgent) ? "firefox-ios" : /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent) ? "safari" : /Chrome/i.test(navigator.userAgent) ? "chrome" : "other";
    const attribution = rememberAttribution({ ...touch, source, campaign: campaign ?? touch.campaign ?? "", variant: campaign ?? "default", first_landing_path: window.location.pathname });
    void captureFunnel("social_landing_view", { source, campaign: campaign ?? "", variant: campaign ?? "default", device: matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop", browser, session_present: Boolean(attribution.sessionId) });
  }, [campaign, source, touch]);
  const start = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    await captureFunnel("social_primary_cta_click", { source, campaign: campaign ?? "", variant: campaign ?? "default", entry: "social_landing" });
    window.location.assign("/assessment");
  };
  return <main className="social-start">
    <header className="social-start-brand"><Link href="/" aria-label="STHENO Fitness home"><SthenoLogo /></Link></header>
    <section className="social-start-hero">
      <div><p className="kicker">{copy.eyebrow}</p><h1>{copy.headline}</h1><p>{copy.subhead}</p><Link className="button button-large" href="/assessment" onClick={start}>Start My Free Assessment</Link><small>No credit card. See your personalized starting recommendations first.</small></div>
      <aside aria-label="What STHENO changes"><span>You miss Tuesday</span><strong>Your next step changes</strong><span>You get stronger</span><strong>Your load guidance changes</strong><span>You travel</span><strong>Your workout changes</strong></aside>
    </section>
    <section className="social-benefits" aria-label="Why STHENO">
      {[['Start with your real life','Your schedule, goals, experience, equipment, and limitations shape where you start.'],['Log what actually happened','Completed sets and reps replace assumptions with useful evidence.'],['Change without starting over','Missed workouts, travel, and new equipment produce a clear next action.'],['Keep learning from progress','Check-ins and performance guide the next measured adjustment.']].map(([title,body],i)=><article key={title}><span>0{i+1}</span><h2>{title}</h2><p>{body}</p></article>)}
    </section>
    <section className="social-how"><p className="kicker">How it works</p><h2>Detailed enough to be useful. Simple enough to finish.</h2><ol><li><strong>Tell us about yourself.</strong><span>Complete STHENO’s detailed fitness assessment.</span></li><li><strong>See your starting recommendations.</strong><span>See how your answers influence your training and nutrition approach.</span></li><li><strong>Build from what actually happens.</strong><span>Your workouts, check-ins, and progress improve future adjustments.</span></li></ol><Link className="button button-large" href="/assessment" onClick={start}>Start My Assessment</Link></section>
  </main>;
}
