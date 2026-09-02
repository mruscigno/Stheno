"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  normalizeStoredBlueprint,
  type StoredBlueprint,
} from "@/modules/acquisition/blueprint-storage";
import { capture } from "@/lib/analytics/client";
import { captureFunnel } from "@/lib/analytics/funnel-client";

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
  const reasoningRef = useRef<HTMLElement>(null);
  useEffect(() => { if (blueprint) { capture("blueprint_viewed", { blueprint_version: blueprint.version }); void captureFunnel("assessment_preview_view", { blueprint_version: blueprint.version }); } }, [blueprint]);
  useEffect(()=>{const element=reasoningRef.current;if(!element||!blueprint)return;let sent=false;const observer=new IntersectionObserver(entries=>{if(!sent&&entries.some(entry=>entry.isIntersecting)){sent=true;void captureFunnel("assessment_preview_reasoning_view",{blueprint_version:blueprint.version});observer.disconnect()}},{threshold:.35});observer.observe(element);return()=>observer.disconnect()},[blueprint]);
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
      <section className="blueprint-reasoning" ref={reasoningRef}>
        <p className="kicker">Why this starting point makes sense</p>
        <h2>These answers changed the recommendation.</h2>
        <div>
          <p>You told us <strong>{blueprint.training.days} training days</strong> are realistic, so the opening structure prioritizes {blueprint.training.days} complete sessions instead of forcing a higher-frequency split.</p>
          <p>Your <strong>{blueprint.training.duration}-minute window</strong> sets the amount of work each session can hold without assuming a perfect schedule.</p>
          <p>Your goal changes the starting emphasis: <strong>{blueprint.training.focus}</strong>.</p>
        </div>
      </section>
      <aside className="blueprint-uncertainty"><p className="kicker">This is a starting point—not a prediction</p><p>Your assessment gives us enough information to build an informed starting plan. Your actual workouts, progress, recovery, and check-ins give us better information over time.</p></aside>
      <section className="blueprint-trajectory">
        <p className="kicker">How the plan should evolve</p>
        {blueprint.trajectory.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>
      <aside className="blueprint-cta">
        <div>
          <p className="kicker">A fitness plan that changes when your life does</p>
          <h2>Your complete plan is ready.</h2>
          <p>
            Turn this starting point into a program that keeps training,
            nutrition, and weekly decisions aligned when real life changes.
          </p>
        </div>
        <Link className="button button-large" href="/signup?next=/app">
          Create My Account →
        </Link>
      </aside>
      <footer>
        <p>{blueprint.disclaimer}</p>
        <Link href="/assessment">Review my recommendations</Link>
      </footer>
    </article>
  );
}
