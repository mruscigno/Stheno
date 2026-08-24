"use client";
import { useEffect, useState } from "react";
import { capture } from "@/lib/analytics/client";

type Snapshot =
  | {
      state: "ready";
      block: {
        name: string;
        focus: string;
        currentWeek: number;
        durationWeeks: number;
        phase: string;
        status: string;
      };
      training: { completedWorkouts: number };
      balance: { status: string; explanation: string };
      recovery: { status: string; explanation: string };
      volume: { decision: string; reasonCodes: string[] };
    }
  | { state: "empty" };
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export function AdaptiveCoachingSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null),
    [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/coaching/adaptive", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ state: "empty" }));
  }, []);
  if (!data || data.state === "empty") return null;
  const explain = (key: string) => {
    setExpanded((current) => (current === key ? null : key));
    capture(
      key === "recovery"
        ? "recovery_status_viewed"
        : "training_balance_explanation_viewed",
      { source_screen: "progress" },
    );
  };
  return (
    <section className="adaptive-snapshot">
      <header>
        <div>
          <p className="eyebrow">Coaching snapshot</p>
          <h1>
            {data.block.name} · Week {data.block.currentWeek} of{" "}
            {data.block.durationWeeks}
          </h1>
          <p>
            {label(data.block.phase)} phase · {data.block.focus}
          </p>
        </div>
        <a className="button secondary" href="/app/program">
          View program
        </a>
      </header>
      <div className="adaptive-snapshot-grid">
        <article>
          <span>Training</span>
          <strong>{data.training.completedWorkouts} workouts recorded</strong>
          <small>{label(data.volume.decision)}</small>
        </article>
        <article>
          <span>Training balance</span>
          <strong>{label(data.balance.status)}</strong>
          <button onClick={() => explain("balance")}>Why?</button>
          {expanded === "balance" && <p>{data.balance.explanation}</p>}
        </article>
        <article>
          <span>Recovery status</span>
          <strong>{label(data.recovery.status)}</strong>
          <button onClick={() => explain("recovery")}>Why?</button>
          {expanded === "recovery" && <p>{data.recovery.explanation}</p>}
        </article>
      </div>
      <p className="snapshot-boundary">
        Recovery is a qualitative coaching signal based on your recent
        records—not a medical measurement or readiness percentage.
      </p>
    </section>
  );
}
