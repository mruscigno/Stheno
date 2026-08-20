"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  normalizeStoredBlueprint,
  type StoredBlueprint,
} from "@/modules/acquisition/blueprint-storage";
import { capture } from "@/lib/analytics/client";

function readBlueprint(): StoredBlueprint | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeStoredBlueprint(
      JSON.parse(localStorage.getItem("stheno_blueprint") || "null"),
    );
  } catch {
    return null;
  }
}

export function BlueprintResult() {
  const [blueprint] = useState<StoredBlueprint | null>(readBlueprint);
  useEffect(() => { if (blueprint) capture("blueprint_viewed", { blueprint_version: blueprint.version }); }, [blueprint]);
  if (!blueprint)
    return (
      <section className="blueprint-empty">
        <p className="kicker">Your STHENO Blueprint</p>
        <h1>Start with a plan built around your real life.</h1>
        <p>
          Complete the free assessment and we’ll turn your schedule, experience,
          equipment, and priorities into a clear starting strategy.
        </p>
        <Link className="button button-large" href="/assessment">
          Build my free Blueprint →
        </Link>
      </section>
    );
  return (
    <article className="blueprint-v2">
      <header className="blueprint-reveal">
        <div>
          <p className="kicker">Your STHENO Blueprint · {blueprint.version}</p>
          <h1>{blueprint.goalLabel}</h1>
          <p>{blueprint.strategy}</p>
        </div>
        <div className="blueprint-stamp">
          <span>BUILT FOR</span>
          <strong>{blueprint.training.days}</strong>
          <small>DAYS / WEEK</small>
        </div>
      </header>
      <section className="blueprint-command">
        <div>
          <span>01 · Training direction</span>
          <h2>{blueprint.training.focus}</h2>
          <p>{blueprint.training.why}</p>
        </div>
        <dl>
          <div>
            <dt>Structure</dt>
            <dd>{blueprint.training.structure}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>{blueprint.training.duration} minutes</dd>
          </div>
        </dl>
      </section>
      <section className="blueprint-week">
        <p className="kicker">Your opening week</p>
        <div>
          {blueprint.training.week.map((session, index) => (
            <div key={session}>
              <span>0{index + 1}</span>
              <strong>{session}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="blueprint-grid">
        <section>
          <span>02 · Nutrition direction</span>
          <h2>
            {blueprint.nutrition.proteinGrams[0]}–
            {blueprint.nutrition.proteinGrams[1]}g
          </h2>
          <strong>Daily protein range</strong>
          <p>
            {blueprint.nutrition.calorieDirection}.{" "}
            {blueprint.nutrition.approach}
          </p>
          <small>{blueprint.nutrition.why}</small>
        </section>
        <section>
          <span>03 · Activity direction</span>
          <h2>Support the work</h2>
          <strong>{blueprint.activity.cardio}</strong>
          <p>{blueprint.activity.daily}.</p>
        </section>
      </div>
      <section className="blueprint-priorities">
        <p className="kicker">What matters first</p>
        <ol>
          {blueprint.priorities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
      <section className="blueprint-trajectory">
        <p className="kicker">How the plan should evolve</p>
        {blueprint.trajectory.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>
      <aside className="blueprint-cta">
        <div>
          <p className="kicker">A fitness plan that changes when your life does</p>
          <h2>You do the work. STHENO handles the plan.</h2>
          <p>
            Turn this starting point into a program that keeps training,
            nutrition, and weekly decisions aligned when real life changes.
          </p>
        </div>
        <Link className="button button-large" href="/signup?next=/pricing">
          Start with STHENO →
        </Link>
      </aside>
      <footer>
        <p>{blueprint.disclaimer}</p>
        <Link href="/assessment">Retake assessment</Link>
      </footer>
    </article>
  );
}
