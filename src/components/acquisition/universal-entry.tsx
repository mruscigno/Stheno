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
      <div className="universal-entry-art">
        <Image
          src="/media/homepage-gateway/stheno-entry-portrait.jpeg"
          alt="STHENO Fitness. Your next session, already adjusted. STHENO builds your starting plan around your schedule, experience and equipment."
          fill
          priority
          sizes="(max-width: 700px) 100vw, 59vh"
        />
        <Link
          className="universal-entry-hit universal-entry-assessment"
          href="/assessment"
          aria-label="Build My Free Plan"
          onClick={() => trackEntryAction("assessment")}
        />
        <Link
          className="universal-entry-hit universal-entry-explore"
          href="/explore"
          aria-label="Explore STHENO"
          onClick={() => trackEntryAction("explore")}
        />
        <Link
          className="universal-entry-hit universal-entry-plan"
          href="/login"
          aria-label="My plan — sign in"
          onClick={() => trackEntryAction("plan")}
        />
      </div>
    </main>
  );
}
