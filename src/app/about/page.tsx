import type { Metadata } from "next";
import { publicMetadata, safeJsonLd, siteUrl } from "@/lib/seo";
import { TrackView, TrackedLink } from "@/components/analytics/tracked-link";

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
    <section className="about-story chrome-shell"><div><p className="kicker">Meet the founder</p><h2>Matthew David</h2><strong>Founder, STHENO Fitness · Certified Personal Trainer</strong></div><div><p>I built STHENO because getting fit has become far more complicated than it needs to be. People are surrounded by workout plans, conflicting nutrition advice, fitness influencers, apps, and endless opinions—but they are still left to figure out what actually makes sense for them.</p><p>As a certified personal trainer, I wanted to create something that gives people the clarity and direction good coaching is supposed to provide without requiring them to organize their lives around fitness. STHENO starts with the person: their goals, experience, schedule, available equipment, preferences, and the realities that can make consistency difficult.</p><p>My goal with STHENO is simple: help people stop wondering what they should be doing and give them a clear plan they can actually follow. Training should fit into your life, adapt when your circumstances change, and become more effective as we learn what works for you.</p><p className="founder-signoff">That’s what <strong>Your fitness. Handled.</strong> means to me.</p></div></section>
    <section className="about-principles"><div className="chrome-shell"><p className="kicker">Product principles</p><h2>Useful enough to act on. Honest enough to trust.</h2><div>{principles.map(([title, copy], index)=><article key={title}><span>0{index+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
    <section className="about-cta chrome-shell"><p className="kicker">Start where you are</p><h2>See the plan STHENO would build around your life.</h2><TrackedLink event="about_assessment_click" className="button button-large" href="/assessment">Take the free assessment →</TrackedLink></section>
<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd({"@context":"https://schema.org","@type":"Organization",name:"STHENO Fitness",url:siteUrl,logo:`${siteUrl}/stheno-logo-horizontal.png`})}} />
  </main>;
}
