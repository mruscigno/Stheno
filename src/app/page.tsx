import Image from "next/image";
import Link from "next/link";
import { tools } from "@/modules/library/tools";
import { articles } from "@/modules/library/articles";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { organizationId, publicMetadata, safeJsonLd, serviceJsonLd, siteUrl, websiteId } from "@/lib/seo";
import { membership, annualSavings } from "@/modules/commerce/product";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { FaqList } from "@/components/public/faq-list";
import { homepageFaqItems } from "@/modules/content/faq";

export const metadata: Metadata = publicMetadata({ title: "STHENO Fitness | Personalized Fitness Coaching & Training Plans", description: "Personalized workouts, nutrition guidance, and ongoing coaching built around your goals, schedule, equipment, and real life.", path: "/" });

const media = "/media/product-14";
const Check = () => (
  <span className="p14-check" aria-hidden="true">
    ✓
  </span>
);

async function exercisePreview() {
  const db = await createSupabaseServerClient();
  if (!db) return { count: 0, exercises: [] };
  const { data, count } = await db.from("exercises").select("slug,name,primary_muscles,required_equipment,education", { count: "exact" }).eq("status", "production").eq("review_status", "reviewed").order("name").limit(6);
  return { count: count ?? data?.length ?? 0, exercises: data ?? [] };
}

export default async function Home() {
  const preview = await exercisePreview();
  return (
    <main className="p14-home">
      <section className="p14-hero">
        <div className="p14-hero-copy">
          <p className="p14-kicker">Personalized fitness coaching</p>
          <h1>
            Your fitness.
            <br />
            <span>Handled.</span>
          </h1>
          <p className="p14-lede">
            Personalized workouts, nutrition, and coaching built around your goals, schedule, experience, equipment, and real life—adapting as you progress.
          </p>
          <div className="p14-actions">
            <TrackedLink event="hero_primary_cta_click" className="p14-button" href="/assessment">Get my free fitness plan <span>→</span></TrackedLink>
            <TrackedLink event="hero_secondary_cta_click" className="p14-text-link" href="/how-it-works">See how STHENO works</TrackedLink>
          </div>
          <p className="p14-no-card">
            No credit card required · Your complete Blueprint is free
          </p>
        </div>
        <div className="p14-hero-media">
          <Image
            src={`${media}/hero-strength.jpg`}
            alt="Adult strength training with dumbbells in a gym"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 58vw"
          />
          <div className="p14-live-card">
            <span>MONDAY · FULL BODY</span>
            <strong>Next: Dumbbell row</strong>
            <small>3 sets · 8–10 reps · 90 sec rest</small>
          </div>
          <div className="p14-hero-badge">
            <strong>3</strong>
            <span>
              workouts
              <br />
              this week
            </span>
          </div>
        </div>
      </section>
      <section className="consistency-callout p14-shell"><div><p className="p14-kicker">Built to keep you consistent</p><p>When life changes, your plan adapts. Miss a workout, travel, or have a hectic week? You don’t start over.</p></div><TrackedLink event="consistency_callout_click" className="p14-text-link" href="#adaptation">See how adaptation works →</TrackedLink></section>
      <section className="p14-blueprint p14-shell">
        <div className="p14-section-copy">
          <p className="p14-kicker">Your personalized Blueprint</p>
          <h2>A plan that starts with you.</h2>
          <p>
            Answer a focused assessment and see exactly how your training,
            nutrition, activity, and progress strategy fit together.
          </p>
          <Link className="p14-text-link" href="/assessment">
            Build your Blueprint →
          </Link>
        </div>
        <BlueprintPreview />
      </section>
      <section className="p14-simplicity">
        <div className="p14-shell">
          <p className="p14-kicker">Fitness made clear</p>
          <h2>You don’t need to become a fitness expert.</h2>
          <div className="p14-three">
            <article>
              <b>01</b>
              <h3>Know exactly what to do.</h3>
              <p>
                Your session, sets, reps, cues, and rest—ready when you are.
              </p>
            </article>
            <article>
              <b>02</b>
              <h3>Know what to eat.</h3>
              <p>
                Useful targets and meal structure without a rigid meal plan.
              </p>
            </article>
            <article>
              <b>03</b>
              <h3>Know when to change things.</h3>
              <p>Your real progress tells STHENO what should happen next.</p>
            </article>
          </div>
        </div>
      </section>
      <section className="p14-training p14-shell">
        <div className="p14-photo-stack">
          <Image
            src={`${media}/gym-training.jpg`}
          alt="Woman strength training in a commercial gym"
          fill
            sizes="(max-width: 800px) 100vw, 46vw"
          />
          <span>{preview.count ? `${preview.count} reviewed exercises` : "Reviewed exercise library"}</span>
        </div>
        <div className="p14-section-copy">
          <p className="p14-kicker">Training</p>
          <h2>Walk into the gym knowing exactly what to do.</h2>
          <p>
            Every workout includes targets, previous performance,
            beginner-friendly exercise guidance, substitutions, and a rest
            timer.
          </p>
          <WorkoutMini />
          <Link className="p14-text-link" href="/how-it-works">
            Explore the training experience →
          </Link>
        </div>
      </section>
      <section className="p14-nutrition">
        <div className="p14-shell">
          <div className="p14-section-copy">
            <p className="p14-kicker">Nutrition</p>
            <h2>Know what to eat without living on a meal plan.</h2>
            <p>
              Calories, protein, macros, meal timing, and supplements—explained
              in the context of your goal and normal food.
            </p>
            <div className="p14-macros">
              <span>
                <b>2,180</b>calories
              </span>
              <span>
                <b>145g</b>protein
              </span>
              <span>
                <b>245g</b>carbs
              </span>
              <span>
                <b>68g</b>fat
              </span>
            </div>
            <Link className="p14-text-link" href="/tools/protein">
              Estimate your protein range →
            </Link>
          </div>
          <div className="p14-food">
            <Image
              src={`${media}/meal-prep.jpg`}
            alt="A balanced meal with vegetables, eggs, and avocado"
            fill
              sizes="(max-width: 800px) 100vw, 48vw"
            />
            <div>
              <strong>Today’s direction</strong>
              <span>Protein at 3–4 meals</span>
              <span>Carbs around training</span>
              <span>Produce twice before dinner</span>
            </div>
          </div>
        </div>
      </section>
      <section className="p14-adapt" id="adaptation">
        <div className="p14-shell">
          <div className="p14-adapt-copy">
            <p className="p14-kicker">Real-life adaptation</p>
            <h2>Your plan should fit the week you actually have.</h2>
            <blockquote>
              “I’m traveling Wednesday through Friday and only have a hotel
              gym.”
            </blockquote>
            <div className="p14-adapt-result">
              <span>Plan updated</span>
              <strong>Friday full body · 30 minutes</strong>
              <small>
                3 hotel-friendly swaps · same movement patterns · no lost week
              </small>
            </div>
          </div>
          <div className="p14-adapt-photo">
            <Image
              src={`${media}/home-training.jpg`}
            alt="Woman completing a limited-equipment workout"
            fill
              sizes="(max-width: 800px) 100vw, 44vw"
            />
          </div>
        </div>
      </section>
      <section className="p14-coach p14-shell">
        <div className="p14-coach-photo">
          <Image
            src={`${media}/phone-training.jpg`}
          alt="Active adults training together"
          fill
            sizes="(max-width: 800px) 100vw, 42vw"
          />
        </div>
        <div className="p14-section-copy">
          <p className="p14-kicker">STHENO Coach</p>
          <h2>Ask a question. Leave with a decision.</h2>
          <div className="p14-chat">
            <p className="user">
              I only have 30 minutes today. What should I do?
            </p>
            <p className="stheno">
              <b>STHENO</b>Keep the first four exercises. I shortened rest on
              the accessories and removed one optional finisher. You’ll preserve
              the main work and finish in about 28 minutes.
            </p>
          </div>
        </div>
      </section>
      <section className="p14-progress">
        <div className="p14-shell">
          <div className="p14-section-copy">
            <p className="p14-kicker">Progress</p>
            <h2>See the trend. Understand the next move.</h2>
            <p>
              Strength, consistency, body trend, recovery, and weekly check-ins
              come together in one clear view.
            </p>
          </div>
          <ProgressPanel />
        </div>
      </section>
      <section className="p14-how p14-shell">
        <div className="p14-section-heading">
          <p className="p14-kicker">How STHENO works</p>
          <h2>One connected coaching loop.</h2>
        </div>
        <ol>
          {[
            [
              "01",
              "Assess",
              "Tell us your goals, experience, schedule, equipment, and constraints.",
            ],
            [
              "02",
              "Plan",
              "Get a training and nutrition strategy built around your starting point.",
            ],
            [
              "03",
              "Train",
              "Open today’s workout and log the whole session in one focused flow.",
            ],
            [
              "04",
              "Check in",
              "Share progress, recovery, adherence, and what real life changed.",
            ],
            [
              "05",
              "Adapt",
              "STHENO explains and applies the next useful adjustment.",
            ],
          ].map(([n, h, p]) => (
            <li key={n}>
              <b>{n}</b>
              <h3>{h}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="p14-evidence">
        <div className="p14-shell">
          <p className="p14-kicker">Built with visible standards</p>
          <h2>Proven principles. Clear reasons. No invented certainty.</h2>
          <div>
            <p>
              <Check /> Built on established training and nutrition principles
            </p>
            <p>
              <Check /> Every plan change comes with a plain-language reason
            </p>
            <p>
              <Check /> Estimates show their limits instead of pretending to be
              promises
            </p>
          </div>
          <Link className="p14-text-link" href="/methodology">
            Read our methodology →
          </Link>
        </div>
      </section>
      <section className="p14-tools p14-shell">
        <div className="p14-section-heading">
          <p className="p14-kicker">Free fitness tools</p>
          <h2>Useful answers. No account required.</h2>
        </div>
        <div className="p14-tool-grid">
          {tools.slice(0, 6).map((tool, index) => (
            <Link href={`/tools/${tool.slug}`} key={tool.slug}>
              <span>0{index + 1}</span>
              <h3>{tool.title}</h3>
              <p>{tool.summary}</p>
              <b>Use tool →</b>
            </Link>
          ))}
        </div>
        <Link className="p14-outline-button" href="/tools">
          Explore all free tools
        </Link>
      </section>
      {preview.exercises.length ? <section className="exercise-proof p14-shell">
        <div className="p14-section-heading"><p className="p14-kicker">Inside the exercise library</p><h2>Real guidance, before you ever start a set.</h2><p>Every public entry below comes directly from the production exercise library.</p></div>
        <div className="exercise-proof-grid">{preview.exercises.map((exercise) => {
          const education = exercise.education as { setup?: string[]; execution?: string[]; cues?: string[]; mistakes?: string[] } | null;
          return <TrackedLink event="exercise_preview_open" eventProperties={{ exercise: exercise.slug }} href={`/exercises/${exercise.slug}`} key={exercise.slug}>
            <span>{(exercise.primary_muscles as string[]).join(" · ")}</span><h3>{exercise.name}</h3><p><b>Equipment</b> {(exercise.required_equipment as string[]).join(", ")}</p><p><b>Set up</b> {education?.setup?.[0] ?? education?.cues?.[0] ?? "Use a stable, repeatable position."}</p><p><b>Do</b> {education?.execution?.[0] ?? education?.cues?.[1] ?? "Move with a controlled range you can repeat."}</p><p><b>Avoid</b> {education?.mistakes?.[0] ?? "Using load that changes the intended movement."}</p><strong>Open exercise guide →</strong>
          </TrackedLink>;
        })}</div><Link className="p14-outline-button" href="/exercises">Browse all {preview.count} movements</Link>
      </section> : null}
      <section className="p14-learn">
        <div className="p14-shell">
          <div className="p14-section-heading">
            <p className="p14-kicker">Learn</p>
            <h2>Fitness guidance worth reading.</h2>
          </div>
          <div className="p14-editorial">
            {articles.slice(0, 3).map((article, index) => (
              <Link href={`/insights/${article.slug}`} key={article.slug}>
                <div className="p14-article-image">
                  <Image
                    src={`${media}/${["recovery.jpg", "food-composition.jpg", "woman-strength.jpg"][index]}`}
                    alt={["Person recovering after a training session", "Balanced foods supporting practical nutrition", "Woman performing a strength-training exercise"][index]}
                    fill
                    sizes="(max-width: 800px) 100vw, 33vw"
                  />
                </div>
                <span>
                  {article.pillar.replaceAll("-", " ")} · {6 + index * 2} min
                  read
                </span>
                <h3>{article.title}</h3>
                <b>Read article →</b>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="p14-pricing p14-shell">
        <div>
          <p className="p14-kicker">One membership</p>
          <h2>Everything connected for less than one training session.</h2>
          <p>
            Begin with the complete 14-day trial. No payment method is required
            to start.
          </p>
        </div>
        <div className="p14-price-card">
          <span>STHENO membership</span>
          <strong>
            {membership.monthly.label}<small>/{membership.monthly.interval}</small>
          </strong>
          <p>or {membership.annual.label} annually · save ${annualSavings}</p>
          <ul>
            <li>Personalized training</li>
            <li>Nutrition guidance</li>
            <li>Adaptive coaching</li>
            <li>Progress intelligence</li>
          </ul>
          <Link className="p14-button" href="/assessment">
            Start my free plan
          </Link>
          <TrackedLink event="compare_click" eventProperties={{ location: "home_pricing" }} className="p14-compare-link" href="/compare">Compare STHENO with other options →</TrackedLink>
        </div>
      </section>
      <section className="p14-faq p14-shell">
        <div>
          <p className="p14-kicker">Common questions</p>
          <h2>Start with confidence.</h2>
        </div>
        <div><FaqList items={homepageFaqItems}/><Link className="p14-text-link faq-view-all" href="/faq">View all FAQs →</Link></div>
      </section>
      <section className="p14-final">
        <Image
          src={`${media}/walking.jpg`}
        alt="Adults moving outdoors"
        fill
          sizes="100vw"
        />
        <div>
          <p className="p14-kicker">Start where you are</p>
          <h2>Your next plan should fit your life.</h2>
          <p>
            Four focused minutes. A complete starting Blueprint. No credit card.
          </p>
          <Link className="p14-button" href="/assessment">
            Build my free plan →
          </Link>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd([
        {"@context":"https://schema.org","@type":"Organization","@id":organizationId,name:"STHENO Fitness",url:siteUrl},
        {"@context":"https://schema.org","@type":"WebSite","@id":websiteId,name:"STHENO Fitness",url:siteUrl,publisher:{"@id":organizationId}},
        serviceJsonLd(),
      ])}} />
    </main>
  );
}

function BlueprintPreview() {
  return (
    <div className="p14-blueprint-card">
      <header>
        <span>STHENO BLUEPRINT</span>
        <b>Ready to begin</b>
      </header>
      <div className="p14-bp-goal">
        <small>PRIMARY GOAL</small>
        <strong>Build strength</strong>
        <span>Realistic pace · 12-week first phase</span>
      </div>
      <div className="p14-bp-grid">
        <span>
          <small>TRAINING</small>
          <b>3 days</b>
          <em>Full body</em>
        </span>
        <span>
          <small>NUTRITION</small>
          <b>2,180 kcal</b>
          <em>145g protein</em>
        </span>
        <span>
          <small>ACTIVITY</small>
          <b>8,000</b>
          <em>steps / day</em>
        </span>
        <span>
          <small>CARDIO</small>
          <b>2 × 20</b>
          <em>minutes</em>
        </span>
      </div>
      <footer>
        <span>
          <i />
          Built around a 45-minute session
        </span>
        <span>
          <i />
          Gym + home backup
        </span>
      </footer>
    </div>
  );
}
function WorkoutMini() {
  return (
    <div className="p14-workout-mini">
      <header>
        <span>TODAY · FULL BODY A</span>
        <b>42 min</b>
      </header>
      {[
        ["Goblet squat", "3 × 8–10", "Last: 40 lb"],
        ["Dumbbell bench press", "3 × 8–12", "Last: 30 lb"],
        ["One-arm row", "3 × 10", "Last: 35 lb"],
      ].map(([name, target, last], i) => (
        <div key={name}>
          <b>0{i + 1}</b>
          <span>
            <strong>{name}</strong>
            <small>
              {target} · {last}
            </small>
          </span>
          <button aria-label={`Exercise info for ${name}`}>Info</button>
        </div>
      ))}
      <footer>
        <span>Rest timer</span>
        <strong>01:24</strong>
      </footer>
    </div>
  );
}
function ProgressPanel() {
  return (
    <div className="p14-progress-panel">
      <div className="p14-trend">
        <header>
          <span>STRENGTH TREND</span>
          <b>+12.4%</b>
        </header>
        <svg
          viewBox="0 0 600 170"
          role="img"
          aria-label="Strength trend rising over eight weeks"
        >
          <path
            d="M10 145 C90 138 115 112 170 120 S255 82 310 90 S400 46 455 56 S535 24 590 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
          />
          <path
            d="M10 145 C90 138 115 112 170 120 S255 82 310 90 S400 46 455 56 S535 24 590 18 L590 170 L10 170Z"
            fill="url(#fade)"
          />
          <defs>
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="currentColor" stopOpacity=".22" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <footer>
          <span>WEEK 1</span>
          <span>WEEK 8</span>
        </footer>
      </div>
      <div className="p14-week-status">
        <span>THIS WEEK</span>
        <strong>On track</strong>
        <p>
          3 of 3 workouts complete. Recovery is stable. Two exercises progress
          next week.
        </p>
        <div>
          <b>87%</b>
          <small>consistency</small>
        </div>
      </div>
    </div>
  );
}
