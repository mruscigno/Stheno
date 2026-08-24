import type { Metadata } from "next";
import Link from "next/link";
import { TrackedLink, TrackView } from "@/components/analytics/tracked-link";
import { FaqList } from "@/components/public/faq-list";
import { homepageFaqItems } from "@/modules/content/faq";
import { tools } from "@/modules/library/tools";
import { articles } from "@/modules/library/articles";
import { annualSavings, membership } from "@/modules/commerce/product";
import { isLive } from "@/modules/marketing/capabilities";
import {
  organizationId,
  publicMetadata,
  safeJsonLd,
  serviceJsonLd,
  siteUrl,
  websiteId,
} from "@/lib/seo";
export const metadata: Metadata = publicMetadata({
  title: "STHENO Fitness | Personalized Training, Nutrition & Progress",
  description:
    "Personalized workouts, practical nutrition guidance, progress tracking and fitness coaching that adapts as you improve and life changes.",
  path: "/",
});
const Cta = ({
  location,
  className = "mr-button",
}: {
  location: string;
  className?: string;
}) => (
  <TrackedLink
    event="primary_cta_clicked"
    eventProperties={{ location }}
    className={className}
    href="/assessment"
  >
    Get Your Free Plan <span aria-hidden="true">→</span>
  </TrackedLink>
);
export default function Home() {
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
            <h1>Personalized fitness coaching that keeps up with you.</h1>
            <p className="mr-lede">
              Your workouts, nutrition and progress in one place—with a plan
              that adapts as you improve and life changes.
            </p>
            <div className="mr-actions">
              <Cta location="homepage_hero" />
              <TrackedLink
                event="hero_secondary_cta_click"
                href="#how-it-works"
                className="mr-link"
              >
                See How It Works
              </TrackedLink>
            </div>
            <small>
              Starts with a personalized assessment. No guesswork required.
            </small>
          </div>
          <ConnectedProductDemo />
        </div>
      </section>
      <section className="mr-problem">
        <div className="mr-shell">
          <p className="mr-kicker">The static-plan problem</p>
          <h2>
            A fitness plan shouldn’t stop being useful the moment real life
            happens.
          </h2>
          <p>
            Most plans know what you were supposed to do. They do not know what
            you completed, what changed, or whether you are progressing. STHENO
            connects those pieces so you can keep moving without starting over.
          </p>
        </div>
      </section>
      <section
        className="mr-promises mr-shell"
        aria-labelledby="promises-title"
      >
        <header>
          <p className="mr-kicker">One connected membership</p>
          <h2 id="promises-title">Know what to do next.</h2>
        </header>
        <div>
          {[
            [
              "01",
              "Training built for you",
              "Your goals, experience, schedule, equipment and preferences shape every starting point.",
            ],
            [
              "02",
              "Nutrition made manageable",
              "Personalized calorie and macro targets, daily logging and food search—without turning meals into a second job.",
            ],
            [
              "03",
              "See what’s working",
              "Follow strength, personal records, consistency, body trends and your goal outlook in one place.",
            ],
            [
              "04",
              "Your plan changes when life does",
              "Use swaps, check-ins and Coach when time, equipment, travel or recovery change.",
            ],
          ].map(([n, h, p]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mr-how" id="how-it-works">
        <div className="mr-shell">
          <header>
            <p className="mr-kicker">How it works</p>
            <h2>One plan. Four useful steps.</h2>
          </header>
          <ol>
            {[
              [
                "Tell us about you",
                "A focused assessment covers your goals, experience, schedule, equipment, preferences and constraints.",
              ],
              [
                "Get your plan",
                "See personalized training and nutrition built around the life you actually have.",
              ],
              [
                "Train, eat and track",
                "Log workouts and meals, check in, and build a record that means something.",
              ],
              [
                "Keep adapting",
                "Progress and changing circumstances inform the next useful decision—never a silent change.",
              ],
            ].map(([h, p], i) => (
              <li key={h}>
                <b>0{i + 1}</b>
                <div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </li>
            ))}
          </ol>
          <Cta location="homepage_how_it_works" />
        </div>
      </section>
      <ProductSection type="training" />
      <ProductSection type="nutrition" />
      <ProductSection type="progress" />
      <section className="mr-adapt">
        <div className="mr-shell mr-split">
          <div>
            <p className="mr-kicker">Adaptation</p>
            <h2>Your life changes. Your plan should too.</h2>
            <p>
              Tell STHENO what changed and review the smallest useful
              adjustment. Nothing important changes silently.
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
            <p className="mr-kicker">A better starting point</p>
            <h2>A plan should know more than your age and goal.</h2>
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
      <section className="mr-pricing mr-shell">
        <div>
          <p className="mr-kicker">One membership</p>
          <h2>Training, nutrition, progress, adaptation and Coach.</h2>
          <p>
            Start with the complete {membership.trialDays}-day trial. No payment
            method is required.
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
          </ul>
          <Cta location="homepage_pricing" />
        </article>
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
function ConnectedProductDemo() {
  return (
    <div
      className="mr-connected-demo"
      role="img"
      aria-label="Illustrative STHENO product interface"
    >
      <div className="mr-demo-workout">
        <header>
          <span>TODAY · UPPER A</span>
          <b>42 min</b>
        </header>
        <h2>Know what to do now.</h2>
        {[
          ["Dumbbell bench press", "190 lb · 3 × 8", "Previous 185 × 8"],
          ["Seated cable row", "3 × 8–12", "2 sets left"],
        ].map(([h, t, s], i) => (
          <div key={h}>
            <b>0{i + 1}</b>
            <span>
              <strong>{h}</strong>
              <small>{t}</small>
            </span>
            <em>{s}</em>
          </div>
        ))}
        <footer>
          <span>Rest timer</span>
          <strong>01:24</strong>
        </footer>
      </div>
      <div className="mr-demo-nutrition">
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
      <div className="mr-demo-progress">
        <span>PROGRESS</span>
        <b>New personal record</b>
        <p>Bench press · 190 × 8</p>
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
          <h2>Know what to do—and what to do next.</h2>
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
          <h2>Nutrition you can actually use every day.</h2>
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
        <h2>See whether the plan is working.</h2>
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
