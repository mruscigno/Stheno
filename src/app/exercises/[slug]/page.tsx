import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MovementDemo } from "@/components/exercises/movement-demo";
import { AnatomyMap } from "@/components/exercises/anatomy-map";
import { completeExerciseGuide } from "@/modules/training/guide-content";
import { getPublicExercise, getPublicExerciseAlternatives } from "@/lib/exercises/public-catalog";
async function getExercise(slug: string) {
  return getPublicExercise(slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    e = await getExercise(slug);
  return e
    ? {
        title: `${e.name} Exercise Guide`,
        description: `Learn how to perform ${e.name}, which muscles it works, common mistakes, and practical coaching cues.`,
        alternates: { canonical: `/exercises/${slug}` },
      }
    : { title: "Exercise not found" };
}
export default async function Exercise({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    e = await getExercise(slug);
  if (!e) notFound();
  const storedEducation = e.education as {
      setup?: string[];
      execution?: string[];
      cues?: string[];
      mistakes?: string[];
    },
    primary = e.primary_muscles as string[],
    secondary = e.secondary_muscles as string[],
    education = completeExerciseGuide({name:e.name,movementPattern:String(e.movement_pattern),primaryMuscles:primary,equipment:e.required_equipment as string[],education:storedEducation}),
    alternativeRows = await getPublicExerciseAlternatives(e.slug, primary),
    alternatives = (alternativeRows??[]).filter(candidate => (candidate.primary_muscles as string[]).some(muscle=>primary.includes(muscle)) && candidate.exercise_role===e.exercise_role).slice(0,6);
  return (
    <main className="exercise-profile shell">
      <nav className="breadcrumbs">
        <Link href="/library">Library</Link> /{" "}
        <Link href="/exercises">Exercises</Link> / {e.name}
      </nav>
      <header>
        <div>
          <p className="eyebrow">Exercise guide · {String(e.skill_level)}</p>
          <h1>{e.name}</h1>
          <p className="lede">{e.purpose}</p>
          <div className="exercise-tags">
            {primary.map((item) => (
              <span key={item}>{item.replaceAll("_", " ")}</span>
            ))}
          </div>
        </div>
        <AnatomyMap primary={primary} secondary={secondary} />
      </header>
      <MovementDemo name={e.name} pattern={String(e.movement_pattern)} equipment={e.required_equipment??[]} />
      <dl className="exercise-facts">
        <div>
          <dt>Equipment</dt>
          <dd>{(e.required_equipment as string[]).join(", ")}</dd>
        </div>
        <div>
          <dt>Typical range</dt>
          <dd>
            {e.rep_min}–{e.rep_max} reps
          </dd>
        </div>
        <div>
          <dt>Also works</dt>
          <dd>{secondary.join(", ") || "Supporting stabilizers"}</dd>
        </div>
      </dl>
      <div className="exercise-instructions">
        <section>
          <p className="kicker">01 · Set up</p>
          {education.setup?.map((item, index) => (
            <div key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </section>
        <section>
          <p className="kicker">02 · Perform</p>
          {education.execution?.map((item, index) => (
            <div key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </section>
      </div>
      <div className="cue-grid">
        <section>
          <h2>Coaching tips</h2>
          <ul>
            {education.cues?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Common mistakes</h2>
          <ul>
            {education.mistakes?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="exercise-feel">
        <h2>What it should feel like</h2>
        <p>{education.feel}</p>
        <h3>Stop or modify when</h3>
        <p>{education.stopModify}</p>
      </section>
      {alternatives.length ? <section className="exercise-alternatives"><p className="kicker">Reviewed alternatives</p><h2>Other ways to train the same primary muscles</h2><div>{alternatives.map(alternative=><Link href={`/exercises/${alternative.slug}`} key={alternative.slug}>{alternative.name}</Link>)}</div></section>:null}
      {(e.caution_tags as string[]).length ? (
        <aside className="exercise-caution">
          <strong>Train within a comfortable range</strong>
          <p>
            Stop if pain is sharp, sudden, or worsening. This guide does not
            diagnose injury or replace qualified care.
          </p>
        </aside>
      ) : null}
      <div className="actions">
        <Link className="button" href="/assessment">
          Build this into my free plan
        </Link>
        <Link className="button secondary" href="/tools/workout-frequency">
          Choose training frequency
        </Link>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: e.name,
            step: [
              ...(education.setup ?? []),
              ...(education.execution ?? []),
            ].map((text) => ({ "@type": "HowToStep", text })),
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </main>
  );
}
