import type { Metadata } from "next";
import Link from "next/link";
import { publicMetadata, safeJsonLd, siteUrl } from "@/lib/seo";
import { TrackView } from "@/components/analytics/tracked-link";

export const metadata: Metadata = publicMetadata({
  title: "About STHENO",
  description: "Why STHENO exists and the principles behind its personalized, practical approach to fitness coaching.",
  path: "/about",
});

const principles = [
  ["Personalized", "Your goal matters, but so do your schedule, experience, equipment, preferences, and constraints."],
  ["Practical", "A useful plan must survive busy weeks, travel, missed sessions, and normal human inconsistency."],
  ["Evidence-informed", "Established training and nutrition principles guide recommendations, with estimates and limits shown clearly."],
  ["Built to adapt", "Completed work, reported effort, recovery, and check-ins shape the next decision instead of forcing a static template."],
];

export default function AboutPage() {
  return <main className="about-page">
    <TrackView event="about_view" />
    <section className="about-hero chrome-shell"><p className="kicker">About STHENO</p><h1>Fitness should not require a second job.</h1><p>STHENO exists to turn the pieces of fitness—training, nutrition, progress, and changing circumstances—into one clear next step.</p></section>
    <section className="about-story chrome-shell"><p className="kicker">Why STHENO exists</p><div><h2>Good guidance should reduce the work of figuring everything out.</h2><p>Most people do not need more fitness information. They need a plan that connects trustworthy principles to their actual life, then changes when life changes.</p><p>STHENO was created to make that process clearer: understand the person, build a realistic starting plan, show what to do today, and use real progress to decide what comes next.</p></div></section>
    <section className="about-principles"><div className="chrome-shell"><p className="kicker">Product principles</p><h2>Useful enough to act on. Honest enough to trust.</h2><div>{principles.map(([title, copy], index)=><article key={title}><span>0{index+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
    <section className="about-cta chrome-shell"><p className="kicker">Start where you are</p><h2>See the plan STHENO would build around your life.</h2><Link className="button button-large" href="/assessment">Take the free assessment →</Link></section>
<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd({"@context":"https://schema.org","@type":"Organization",name:"STHENO Fitness",url:siteUrl,logo:`${siteUrl}/stheno-logo.png`})}} />
  </main>;
}
