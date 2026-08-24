"use client";
/* eslint-disable react-hooks/set-state-in-effect -- initial remote state load and a browser-event subscription */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { TrainingProgram } from "@/modules/training/types";
type State = { state: "ready"; program: TrainingProgram } | { state: "empty" };
export function ProgramExperience() {
  const [data, setData] = useState<State | null>(null),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/training/program", {
        cache: "no-store",
      }),
      body = await response.json(),
      program = body.program?.prescription ?? body.program;
    setData(
      response.ok && program ? { state: "ready", program } : { state: "empty" },
    );
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("stheno:assessment-claimed", refresh);
    return () =>
      window.removeEventListener("stheno:assessment-claimed", refresh);
  }, [load]);
  async function generate() {
    setMessage("Building your program…");
    const response = await fetch("/api/training/program", { method: "POST" }),
      body = await response.json();
    if (!response.ok)
      return setMessage(body.error ?? "Unable to build your program.");
    setData({ state: "ready", program: body.program });
    setMessage("");
  }
  if (!data) return <p className="muted">Loading your program…</p>;
  if (data.state === "empty")
    return (
      <section className="status">
        <p className="eyebrow">Your program</p>
        <h1>Your saved assessment is being connected.</h1>
        <p className="lede">
          If you completed the free assessment before joining, it will be
          claimed automatically—no re-entry required.
        </p>
        <button className="button" onClick={() => void generate()}>
          Build my program
        </button>
        {message ? <p role="status">{message}</p> : null}
      </section>
    );
  const block = data.program.block ?? { name: "Foundation", focus: data.program.name, currentWeek: 1, durationWeeks: data.program.weeks, phase: "foundation" as const, status: "active" as const, blockIndex: 1, reasonCodes: ["LEGACY_PROGRAM_BLOCK_DERIVED"] };
  return (
    <section className="status">
      <p className="eyebrow">Your current program</p>
      <h1>{data.program.name}</h1>
      <p className="lede">
        {data.program.workouts.length} workouts per week · {data.program.weeks}{" "}
        week program
      </p>
      <article className="status program-block-context">
        <span>Training block {block.blockIndex}</span>
        <strong>{block.name} · Week {block.currentWeek} of {block.durationWeeks}</strong>
        <p>{block.phase.replaceAll("_", " ")} phase · {block.focus}</p>
        <small>Your exercises, completed sets, and recovery feedback carry forward when the block changes.</small>
      </article>
      <div className="status-grid">
        {data.program.workouts.map((workout) => (
          <article className="status" key={workout.key}>
            <span>
              Day {workout.dayOrdinal} · {workout.estimatedMinutes} min
            </span>
            <strong>{workout.name}</strong>
            <p>{workout.focus}</p>
          </article>
        ))}
      </div>
      <div className="program-actions">
        <Link className="button" href="/app/workout">
          Start today&apos;s workout
        </Link>
        <Link className="button secondary" href="/app/assessment?restart=1">
          Create a new program
        </Link>
      </div>
      <p className="muted">
        Creating a new program starts a fresh assessment. Your current program
        stays active until its replacement is ready.
      </p>
    </section>
  );
}
