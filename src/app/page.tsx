import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { TrackedLink, TrackView } from "@/components/analytics/tracked-link";
import { FaqList } from "@/components/public/faq-list";
import { homepageFaqItems } from "@/modules/content/faq";
import { tools } from "@/modules/library/tools";
import { articles } from "@/modules/library/articles";
import { annualSavings, membership } from "@/modules/commerce/product";
import { isLive } from "@/modules/marketing/capabilities";
import { TractionCounter } from "@/components/marketing/traction-counter";
import { HomepageEntryGate } from "@/components/acquisition/homepage-gateway";
import {
  organizationId,
  publicMetadata,
  safeJsonLd,
  serviceJsonLd,
  siteUrl,
  websiteId,
} from "@/lib/seo";
export const metadata: Metadata = publicMetadata({
  title: "STHENO Fitness | Ongoing Training, Nutrition & Coaching",
  description:
    "A fitness plan that keeps coaching after Day 1—using your workouts, missed sessions, progress, travel and check-ins to guide what happens next.",
  path: "/",
});
const Cta = ({
  location,
  className = "mr-button",
  event = "primary_cta_clicked",
}: {
  location: string;
  className?: string;
  event?: "primary_cta_clicked" | "homepage_primary_cta_clicked";
}) => (
  <TrackedLink
    event={event}
    heyCatchEvent="social_primary_cta_click"
    eventProperties={{ location }}
    className={className}
    href="/assessment"
  >
    Build My Free Plan <span aria-hidden="true">→</span>
  </TrackedLink>
);
function MarketingHomepage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: homepageFaqItems.map((x) => ({
      "@type": "Question",
      name: x.question,
      acceptedAnswer: { "@type": "Answer", text: x.answer },
    })),
  };
  return (
    <main className="mr-home">
      <TrackView event="landing_viewed" />
      <section className="mr-hero">
        <div className="mr-shell mr-hero-grid">
          <div className="mr-hero-copy">
            <p className="mr-kicker">Your fitness. Handled.</p>
            <h1>A fitness plan that changes when your life does.</h1>
            <p className="mr-lede">
              STHENO Fitness builds your training and nutrition around your
              life—then keeps adjusting as you train, miss workouts, travel,
              get stronger and check in.
            </p>
            <div className="mr-actions">
              <Cta
                location="homepage_hero"
                event="homepage_primary_cta_clicked"
              />
              <TrackedLink
                event="hero_secondary_cta_click"
                href="#how-it-works"
                className="mr-link"
              >
                See How It Works
              </TrackedLink>
            </div>
            <small>
              35 questions · No credit card · See your personalized starting plan
            </small>
            <Suspense fallback={null}>
              <TractionCounter />
            </Suspense>
          </div>
          <HeroVisual />
        </div>
      </section>
      <section className="mr-problem">
        <div className="mr-shell">
          <p className="mr-kicker">The plan is just the beginning</p>
          <h2>Your life changed. Your plan should too.</h2>
          <div className="mr-change-signals" aria-label="Changes STHENO can respond to">
            {["Missed workout", "Travel week", "Got stronger", "Less time", "Different equipment", "Recovery changed"].map((signal)=><span key={signal}>{signal}</span>)}
          </div>
        </div>
      </section>
      <section className="mr-generator" aria-labelledby="generator-title">
        <div className="mr-shell mr-generator-grid">
          <div className="mr-generator-photo">
            <Image src="/media/product-14/gym-training.jpg" alt="Athlete training with free weights in a gym" fill sizes="(max-width: 900px) 100vw, 52vw" />
          </div>
          <div>
            <p className="mr-kicker">Not another workout generator</p>
            <h2 id="generator-title">A generated workout is a beginning—not coaching.</h2>
            <p>STHENO stays involved before training, during the session, between workouts, at check-in and when real life changes the plan.</p>
            <ul><li>Starts with your context</li><li>Guides the work in front of you</li><li>Uses what you actually complete</li><li>Explains the next adjustment</li></ul>
          </div>
        </div>
      </section>
      <section className="mr-journey mr-shell" id="how-it-works" aria-labelledby="journey-title">
        <header>
          <p className="mr-kicker">Ongoing coaching</p>
          <h2 id="journey-title">What happens after your plan is built?</h2>
        </header>
        <ol>
          {[
            ["Day 1", "STHENO learns your life", "Goals, schedule, equipment, experience and nutrition shape your starting plan."],
            ["Tuesday", "You complete the workout", "What you actually lifted—not what was merely scheduled—becomes the new baseline."],
            ["Thursday", "Work blows up", "A missed session does not ruin the week. STHENO shows the next useful session."],
            ["Next week", "Your press improves", "Hit the target cleanly? Your next load recommendation responds."],
            ["Travel week", "The equipment changes", "Tell STHENO you have a hotel gym and your exercise options change."],
            ["Check-in", "The estimate meets reality", "Performance, recovery, adherence and body trends guide the next adjustment."],
            ["Next block", "Your program evolves", "The next plan starts with evidence from the work you actually completed."],
          ].map(([when, h, p]) => (
            <li key={when}>
              <span>{when}</span>
              <div>
              <h3>{h}</h3>
              <p>{p}</p>
              </div>
            </li>
          ))}
        </ol>
        <Cta location="homepage_how_it_works" />
      </section>
      <ProductSection type="training" />
      <ProductSection type="nutrition" />
      <ProductSection type="progress" />
      <section className="mr-exercise-proof" aria-labelledby="exercise-proof-title">
        <div className="mr-shell mr-exercise-proof-grid">
          <div className="mr-exercise-media">
            <video controls preload="metadata" playsInline aria-label="Dumbbell bench press exercise demonstration">
              <source src="/exercise-media/vital/videos/dumbbell-bench-press.mp4" type="video/mp4" />
            </video>
            <span>Reviewed movement demo</span>
          </div>
          <div>
            <p className="mr-kicker">Exercise guidance</p>
            <h2 id="exercise-proof-title">Know what to do. Know how to do it.</h2>
            <p>An exercise name is not instruction. STHENO pairs the movement with setup, execution, useful cues, common mistakes, what you should feel and reviewed substitutions.</p>
            <dl>
              <div><dt>Set up</dt><dd>Plant your feet, set the bench, and bring the dumbbells into a stable start.</dd></div>
              <div><dt>Useful cue</dt><dd>Lower with control; press while keeping your shoulders organized.</dd></div>
              <div><dt>Modify when</dt><dd>The range creates sharp, worsening, or joint-focused pain.</dd></div>
            </dl>
            <Link className="mr-link" href="/exercises/dumbbell-bench-press">Open the full exercise guide</Link>
          </div>
        </div>
      </section>
      <section className="mr-proof" aria-labelledby="proof-title">
        <div className="mr-shell">
          <header>
            <p className="mr-kicker">Show me the change</p>
            <h2 id="proof-title">Real-life input. A clear next action.</h2>
          </header>
          <div className="mr-proof-grid">
            {[
              ["Missed Tuesday", "Upper A was missed", "Next action", "Continue with the next planned session—no unsafe catch-up day."],
              ["You got stronger", "185 lb × 8 with two reps left", "Load guidance", "Try 190 lb with the same rep target."],
              ["Hotel gym", "Dumbbells to 50 lb and one bench", "Workout change", "Keep the movement patterns; use reviewed dumbbell alternatives."],
              ["Check-in", "Trend is slower than the starting estimate", "Nutrition review", "Review adherence and the trend before making one measured adjustment."],
            ].map(([signal, before, label, after]) => (
              <article key={signal}>
                <span>{signal}</span>
                <p>{before}</p>
                <i aria-hidden="true">↓</i>
                <b>{label}</b>
                <strong>{after}</strong>
              </article>
            ))}
          </div>
          <small>Illustrative examples of existing STHENO workflows—not customer results or guaranteed outcomes.</small>
        </div>
      </section>
      <section className="mr-adapt">
        <div className="mr-shell mr-split">
          <div>
            <p className="mr-kicker">When life changes</p>
            <h2>Miss a workout? Your week changes.</h2>
            <p>
              Tell STHENO what changed. You’ll see the smallest useful
              adjustment before anything important changes.
            </p>
            <ul>
              <li>Short on time today</li>
              <li>Training in a hotel gym</li>
              <li>Need a reviewed exercise swap</li>
              <li>Getting stronger than the current target</li>
              <li>Nutrition trend needs a closer look</li>
            </ul>
          </div>
          <div className="mr-change-card">
            <span>YOU SAID</span>
            <blockquote>“I only have 25 minutes today.”</blockquote>
            <div>
              <small>FULL BODY A · 52 MIN</small>
              <b aria-hidden="true">↓</b>
              <strong>Priority session · 24 min</strong>
              <p>Squat, press and row stay. Optional volume moves out.</p>
            </div>
            <em>Review before applying</em>
          </div>
        </div>
      </section>
      <section className="mr-life" aria-labelledby="life-title">
        <div className="mr-shell"><p className="mr-kicker">Built for the week you actually have</p><h2 id="life-title">The setting changes. The work can still count.</h2></div>
        <div className="mr-life-strip">
          {[
            ["/media/product-14/phone-training.jpg","Busy week","You lost the hour. You didn’t lose the workout."],
            ["/media/product-14/home-training.jpg","Home gym","Use the equipment you have without losing the purpose of the session."],
            ["/media/product-14/recovery.jpg","Returning","Start from what you can repeat now—not what you used to do."],
          ].map(([src,label,copy])=><figure key={label}><Image src={src} alt="" fill sizes="(max-width: 700px) 100vw, 34vw"/><figcaption><span>{label}</span><strong>{copy}</strong></figcaption></figure>)}
        </div>
      </section>
      <section className="mr-coach mr-shell">
        <div>
          <p className="mr-kicker">STHENO Coach</p>
          <h2>Questions come up. Ask your coach.</h2>
          <p>
            Get direct help with training, exercise substitutions, nutrition
            guidance, progress and supported plan changes.
          </p>
          <div className="mr-question-list">
            <span>What weight should I use next?</span>
            <span>What can I substitute?</span>
            <span>How am I progressing?</span>
            <span>How can I hit my protein target?</span>
          </div>
        </div>
        <div className="mr-coach-ui">
          <header>
            <span className="mr-s">S</span>
            <div>
              <b>STHENO Coach</b>
              <small>Uses your current plan and logged history</small>
            </div>
          </header>
          <p className="user">What weight should I use next?</p>
          <p className="coach">
            Your last three completed sets were 185 lb for 8 reps with two reps
            left. The current load guidance is 190 lb. Keep the same rep target
            and record how it feels.
          </p>
          <small>Fitness guidance—not diagnosis or medical care.</small>
        </div>
      </section>
      <section className="mr-assessment">
        <div className="mr-shell mr-split">
          <div>
            <p className="mr-kicker">We ask before we build</p>
            <h2>Good coaching starts by knowing you.</h2>
            <p>Your answers shape the starting plan. They are not a promise or a prediction. The work you complete gives STHENO better information for what happens next.</p>
          </div>
          <div className="mr-assessment-list">
            {[
              "Goals and training experience",
              "Weekly schedule and session length",
              "Available equipment and environment",
              "Exercise preferences and constraints",
              "Nutrition context and normal routines",
              "Real-life considerations that affect consistency",
            ].map((x) => (
              <span key={x}>✓ {x}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="mr-comparison mr-shell">
        <header>
          <p className="mr-kicker">Static plan or ongoing direction?</p>
          <h2>A plan built once can’t coach what happens next.</h2>
        </header>
        <div>
          <article>
            <span>Static plan</span>
            <ul><li>Built once</li><li>Assumes the week goes perfectly</li><li>Doesn’t know what you completed</li><li>Travel breaks the schedule</li><li>Leaves you to decide what changes</li></ul>
          </article>
          <article className="stheno">
            <span>STHENO</span>
            <ul><li>Starts personalized</li><li>Tracks what actually happens</li><li>Responds to missed sessions</li><li>Uses workout performance and check-ins</li><li>Tells you what to do next</li></ul>
          </article>
        </div>
      </section>
      <section className="mr-pricing mr-shell">
        <div>
          <p className="mr-kicker">One membership</p>
          <h2>Training, nutrition and the next adjustment—in one membership.</h2>
          <p>
            Start with the complete {membership.trialDays}-day trial. No payment
            method is required. STHENO is not a replacement for every use case
            for an in-person trainer. It gives you connected training, nutrition,
            exercise guidance, tracking, check-ins and plan adjustments for {membership.monthly.label} per month.
          </p>
          <Link href="/pricing" className="mr-link">
            See full pricing details
          </Link>
        </div>
        <article>
          <span>STHENO membership</span>
          <strong>
            {membership.monthly.label}
            <small> / {membership.monthly.interval}</small>
          </strong>
          <p>
            or {membership.annual.label} annually · save ${annualSavings}
          </p>
          <ul>
            <li>Personalized training</li>
            <li>Daily nutrition tools</li>
            <li>Progress and goal outlook</li>
            <li>Coach and plan adjustments</li>
            <li>30-day money-back guarantee</li>
          </ul>
          <Cta location="homepage_pricing" />
        </article>
      </section>
      <section className="mr-founder mr-shell">
        <div>
          <p className="mr-kicker">Built for a clearer answer</p>
          <h2>Fitness advice is abundant. Clear ongoing direction is not.</h2>
        </div>
        <div>
          <p>STHENO was created to answer one practical question: <strong>What should I do next?</strong></p>
          <p className="founder-signoff">Matthew David<br/><small>Certified Personal Trainer · Founder, STHENO Fitness</small></p>
          <div><Link href="/about">Why STHENO exists</Link><Link href="/methodology">How recommendations are made</Link><Link href="/editorial-standards">Editorial standards</Link></div>
        </div>
      </section>
      <section className="mr-resources">
        <div className="mr-shell">
          <header>
            <p className="mr-kicker">Useful before you join</p>
            <h2>Clear answers, free.</h2>
          </header>
          <div className="mr-resource-grid">
            {tools.slice(0, 3).map((t) => (
              <Link href={`/tools/${t.slug}`} key={t.slug}>
                <span>FREE TOOL</span>
                <h3>{t.title}</h3>
                <p>{t.summary}</p>
                <b>Use tool →</b>
              </Link>
            ))}
            {articles.slice(0, 3).map((a) => (
              <Link href={`/insights/${a.slug}`} key={a.slug}>
                <span>{a.pillar.replaceAll("-", " ")}</span>
                <h3>{a.title}</h3>
                <p>{a.thesis}</p>
                <b>Read guide →</b>
              </Link>
            ))}
          </div>
          <div className="mr-resource-links">
            <Link href="/exercises">Browse exercises</Link>
            <Link href="/methodology">Read our methodology</Link>
            <Link href="/about">Meet STHENO</Link>
          </div>
        </div>
      </section>
      <section className="mr-faq mr-shell" id="faq">
        <header>
          <p className="mr-kicker">Common questions</p>
          <h2>Start with clarity.</h2>
        </header>
        <div>
          <FaqList items={homepageFaqItems} />
          <Link href="/faq" className="mr-link">
            View all questions
          </Link>
        </div>
      </section>
      <section className="mr-final">
        <div className="mr-shell">
          <p className="mr-kicker">Start where you are</p>
          <h2>Your fitness plan should fit your life.</h2>
          <p>
            Complete the assessment and see what STHENO would build around you.
          </p>
          <Cta location="homepage_final" />
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": organizationId,
              name: "STHENO Fitness",
              url: siteUrl,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": websiteId,
              name: "STHENO Fitness",
              url: siteUrl,
              publisher: { "@id": organizationId },
            },
            serviceJsonLd(),
            faqSchema,
          ]),
        }}
      />
    </main>
  );
}
export default function Home() {
  return <HomepageEntryGate><MarketingHomepage /></HomepageEntryGate>;
}
function HeroVisual() {
  return (
    <div
      className="mr-hero-visual"
      role="group"
      aria-label="STHENO training experience"
    >
      <div className="mr-hero-photo">
        <Image
          src="/media/product-14/hero-strength.jpg"
          alt="Adult strength training with dumbbells in a gym"
          fill
          priority
          sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 900px) calc(100vw - 40px), 54vw"
        />
      </div>
      <div
        className="mr-hero-workout"
        role="group"
        aria-label="Illustrative workout preview"
      >
        <header>
          <span>TODAY · UPPER A</span>
          <b>42 min</b>
        </header>
        <strong>Dumbbell bench press</strong>
        <div>
          <span>190 lb</span>
          <span>3 × 8</span>
          <em>Previous 185 × 8</em>
        </div>
      </div>
      <div
        className="mr-hero-nutrition"
        role="group"
        aria-label="Illustrative nutrition preview"
      >
        <span>NUTRITION</span>
        <strong>
          1,730 <small>/ 2,400 kcal</small>
        </strong>
        <div>
          <i style={{ width: "72%" }} />
        </div>
        <p>
          <b>142g</b> / 180g protein
        </p>
      </div>
    </div>
  );
}
function ProductSection({
  type,
}: {
  type: "training" | "nutrition" | "progress";
}) {
  if (type === "training")
    return (
      <section className="mr-product mr-shell" id="training">
        <div>
          <p className="mr-kicker">Training</p>
          <h2>Hit your reps? We’ll tell you when it’s time to progress.</h2>
          <p>
            Open a complete workout with previous performance, load guidance,
            instructions, swaps, logging, a rest timer and personal-record
            feedback.
          </p>
          <Link className="mr-link" href="/how-it-works">
            Explore the training experience
          </Link>
        </div>
        <div className="mr-screen training">
          <header>
            <span>UPPER A</span>
            <b>7 / 13 sets</b>
          </header>
          <div className="exercise">
            <b>Dumbbell Bench Press</b>
            <small>3 sets · 6–10 reps</small>
            <div>
              <span>185 lb</span>
              <span>8 reps</span>
              <span>2 left</span>
              <strong>✓</strong>
            </div>
            <p>Previous: 180 × 8 · Next guidance: 190 lb</p>
          </div>
          <footer>
            <span>Timer 01:24</span>
            <span>Swap exercise</span>
            <span>View instructions</span>
          </footer>
        </div>
      </section>
    );
  if (type === "nutrition") {
    if (!isLive("nutritionTracking")) return null;
    return (
      <section className="mr-product reverse mr-shell" id="nutrition">
        <div>
          <p className="mr-kicker">Nutrition</p>
          <h2>If the starting target misses, the next decision uses your real trend.</h2>
          <p>
            Get personalized calorie and macro targets, then see how your day is
            tracking without turning nutrition into a second job.
          </p>
          <Link className="mr-link" href="/tools">
            Explore free nutrition tools
          </Link>
        </div>
        <div className="mr-screen nutrition">
          <header>
            <span>TODAY</span>
            <b>Partial log</b>
          </header>
          <strong>
            1,730 <small>/ 2,400 calories</small>
          </strong>
          <div className="meter">
            <i />
          </div>
          <div className="macros">
            <span>
              <b>142g</b>protein
            </span>
            <span>
              <b>168g</b>carbs
            </span>
            <span>
              <b>54g</b>fat
            </span>
          </div>
          <ul>
            <li>
              <span>Breakfast · Greek yogurt bowl</span>
              <b>420</b>
            </li>
            <li>
              <span>Lunch · Chicken rice bowl</span>
              <b>680</b>
            </li>
            <li>
              <span>Snack · Protein shake</span>
              <b>220</b>
            </li>
          </ul>
          <span className="demo-action">Add food</span>
        </div>
      </section>
    );
  }
  return (
    <section className="mr-product mr-shell" id="progress">
      <div>
        <p className="mr-kicker">Progress</p>
        <h2>See what changed—and what to do next.</h2>
        <p>
          STHENO connects what you are doing with how you are progressing, then
          turns the numbers into guidance you can understand.
        </p>
        <small className="mr-illustrative">
          Illustrative product data—not a customer result.
        </small>
      </div>
      <div className="mr-screen progress">
        <header>
          <span>8-WEEK VIEW</span>
          <b>Building evidence</b>
        </header>
        <div className="chart">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="progress-stats">
          <span>
            <small>WORKOUTS</small>
            <b>21 / 24</b>
          </span>
          <span>
            <small>PERSONAL RECORDS</small>
            <b>4</b>
          </span>
          <span>
            <small>GOAL OUTLOOK</small>
            <b>On track</b>
          </span>
        </div>
      </div>
    </section>
  );
}
