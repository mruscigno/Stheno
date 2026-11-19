"use client";

import Image from "next/image";
import Link from "next/link";
import { capture } from "@/lib/analytics/client";
import { captureFunnel } from "@/lib/analytics/funnel-client";

type EntryAction = "assessment" | "explore" | "plan";

function trackEntryAction(action: EntryAction) {
  const properties = { location: "universal_homepage", action };
  capture(action === "assessment" ? "homepage_primary_cta_clicked" : "hero_secondary_cta_click", properties);
  if (action === "assessment") {
    void captureFunnel("social_primary_cta_click", properties, { dedupeKey: "universal-homepage" });
  }
}

export function UniversalEntry() {
  return (
    <main className="universal-entry" aria-label="STHENO Fitness">
      <Image className="universal-entry-photo" src="/media/homepage-gateway/stheno-entry-background-v2.png" alt="A hand holding an adjustable dumbbell" fill priority sizes="100vw" />
      <div className="universal-entry-shade" aria-hidden="true" />
      <header className="universal-entry-brand" aria-label="STHENO Fitness"><strong>STHENO</strong><span>Fitness</span></header>
      <section className="universal-entry-copy">
        <h1>Your next session,<br />already adjusted.</h1>
        <p>STHENO builds your starting plan around<br className="desktop-break" /> your schedule, experience and equipment.</p>
        <Link
          className="universal-entry-primary"
          href="/assessment"
          onClick={() => trackEntryAction("assessment")}
        ><span>Build My Free Plan</span><b aria-hidden="true">→</b></Link>
      </section>
      <nav className="universal-entry-dock" aria-label="Homepage navigation">
        <Link
          className="universal-entry-nav-action"
          href="/explore"
          onClick={() => trackEntryAction("explore")}
        ><i className="universal-entry-menu" aria-hidden="true"><span /><span /></i><span>Explore</span></Link>
        <span className="universal-entry-dumbbell" aria-hidden="true"><i /><b /><i /></span>
        <Link
          className="universal-entry-nav-action universal-entry-plan"
          href="/login"
          onClick={() => trackEntryAction("plan")}
        ><span>My plan</span><b aria-hidden="true">→</b></Link>
      </nav>
    </main>
  );
}
