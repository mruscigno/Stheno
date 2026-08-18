"use client";
/* eslint-disable react-hooks/set-state-in-effect -- effects hydrate remote workout state and subscribe to a timer */
import { useCallback, useEffect, useState } from "react";
import { AnatomyMap } from "@/components/exercises/anatomy-map";
import { MovementDemo } from "@/components/exercises/movement-demo";
type Exercise = {
  exerciseSlug: string;
  exerciseName: string;
  sets: number;
  repMin: number;
  repMax: number;
  rir: number;
  restSeconds: number;
  alternatives: string[];
};
type Workout = {
  name: string;
  focus: string;
  estimatedMinutes: number;
  exercises: Exercise[];
};
type SetLog = {
  exercise_slug: string;
  set_ordinal: number;
  load_value: number | null;
  repetitions: number;
  rir: number;
};
type Performance = { load: number; reps: number } | null;
type Data = {
  state: string;
  session?: { id: string };
  workout?: Workout;
  sets?: SetLog[];
  lastPerformance?: Performance;
  next?: {
    exerciseIndex: number;
    setOrdinal: number;
    exercise: Exercise;
  } | null;
};
type Education = {
  setup?: string[];
  execution?: string[];
  cues?: string[];
  mistakes?: string[];
};
type ExerciseInfo = {
  slug: string;
  name: string;
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  required_equipment: string[];
  education: Education;
  caution_tags: string[];
};
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
function ExerciseGuide({
  exercise,
  alternatives,
  onClose,
}: {
  exercise: ExerciseInfo;
  alternatives: string[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<
      "overview" | "how" | "muscles" | "alternatives"
    >("overview"),
    education = exercise.education ?? {},
    primary = exercise.primary_muscles ?? [],
    secondary = exercise.secondary_muscles ?? [];
  return (
    <div
      className="exercise-sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="exercise-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-guide-title"
      >
        <header>
          <div>
            <p className="eyebrow">Exercise guide</p>
            <h2 id="exercise-guide-title">{exercise.name}</h2>
          </div>
          <button
            className="sheet-close"
            type="button"
            aria-label="Close exercise guide"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <MovementDemo
          name={exercise.name}
          pattern={exercise.movement_pattern}
          version="current"
        />
        <div className="muscle-summary">
          <span>
            <b>Primary</b>
            {primary.map(label).join(" · ")}
          </span>
          <span>
            <b>Also works</b>
            {secondary.length
              ? secondary.map(label).join(" · ")
              : "Supporting muscles"}
          </span>
        </div>
        <div
          className="exercise-tabs"
          role="tablist"
          aria-label="Exercise information"
        >
          {(
            [
              ["overview", "Overview"],
              ["how", "How to"],
              ["muscles", "Muscles"],
              ["alternatives", "Alternatives"],
            ] as const
          ).map(([key, text]) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === key}
              key={key}
              onClick={() => setTab(key)}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="exercise-tab-panel" role="tabpanel">
          {tab === "overview" ? (
            <>
              <h3>Why it&apos;s in your workout</h3>
              <p>
                This movement trains your{" "}
                {primary.map(label).join(" and ").toLowerCase()} through a
                controlled, repeatable range.
              </p>
              <h3>Coaching tips</h3>
              <ul>
                {(education.cues?.length
                  ? education.cues
                  : [
                      "Move with control and keep every rep consistent.",
                      "Finish the set before your technique changes.",
                    ]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {exercise.caution_tags?.length ? (
                <aside className="exercise-safety">
                  Use a comfortable range. Stop if pain is sharp, sudden, or
                  worsening.
                </aside>
              ) : null}
            </>
          ) : null}
          {tab === "how" ? (
            <div className="how-grid">
              <section>
                <h3>Set up</h3>
                <ol>
                  {(education.setup ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
              <section>
                <h3>Perform</h3>
                <ol>
                  {(education.execution ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
              <section>
                <h3>Common mistakes</h3>
                <ul>
                  {(education.mistakes ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}
          {tab === "muscles" ? (
            <div className="anatomy-panel">
              <AnatomyMap primary={primary} secondary={secondary} />
              <div>
                <h3>Muscles worked</h3>
                <p>
                  <b>Primary:</b> {primary.map(label).join(", ")}
                </p>
                <p>
                  <b>Secondary:</b>{" "}
                  {secondary.length
                    ? secondary.map(label).join(", ")
                    : "Supporting stabilizers"}
                </p>
              </div>
            </div>
          ) : null}
          {tab === "alternatives" ? (
            <div className="alternative-list">
              <h3>Good substitutions</h3>
              {alternatives.length ? (
                alternatives.map((slug, index) => (
                  <article key={slug}>
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{label(slug.replaceAll("-", " "))}</strong>
                      <p>
                        Similar training role, ranked for your available
                        equipment and program.
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <p>
                  Your coach has not assigned a direct substitution for this
                  movement.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
function AdjustmentMenu({
  exercise,
  onReplace,
}: {
  exercise: Exercise;
  onReplace: (
    reason: string,
    scope: string,
    replacement: string,
  ) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [scope, setScope] = useState("session_only"),
    [replacement, setReplacement] = useState(exercise.alternatives[0] ?? "");
  const reasons = [
    ["equipment_occupied", "Equipment unavailable or occupied"],
    ["discomfort", "This movement doesn’t feel good"],
    ["dislike", "I don’t like this exercise"],
    ["other", "Other"],
  ];
  if (!open)
    return (
      <button
        className="change-exercise"
        type="button"
        onClick={() => setOpen(true)}
      >
        Need to change this exercise?
      </button>
    );
  return (
    <section className="adjustment-card">
      <header>
        <div>
          <p className="eyebrow">Exercise adjustment</p>
          <h3>What do you need?</h3>
        </div>
        <button
          type="button"
          aria-label="Close adjustment options"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </header>
      <div className="adjustment-options">
        {reasons.map(([value, text]) => (
          <button
            type="button"
            className={reason === value ? "selected" : ""}
            aria-pressed={reason === value}
            key={value}
            onClick={() => setReason(value)}
          >
            {text}
          </button>
        ))}
      </div>
      {reason ? (
        <>
          <div className="replacement-card">
            <span>Recommended replacement</span>
            <strong>
              {replacement
                ? label(replacement.replaceAll("-", " "))
                : "No direct replacement available"}
            </strong>
            <p>Chosen to preserve the same role in today&apos;s session.</p>
            {exercise.alternatives.length > 1 ? (
              <select
                aria-label="Replacement exercise"
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
              >
                {exercise.alternatives.map((slug) => (
                  <option key={slug} value={slug}>
                    {label(slug.replaceAll("-", " "))}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {reason === "discomfort" ? (
            <p className="safety-note">
              Don&apos;t train through significant pain. Use a comfortable
              alternative only if it feels appropriate. Seek qualified care for
              severe, sudden, or persistent symptoms.
            </p>
          ) : null}
          <fieldset>
            <legend>How long should this change last?</legend>
            {[
              ["session_only", "Just today"],
              ["program", "For this program"],
              ["persistent", "Going forward until changed"],
            ].map(([value, text]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="scope"
                  value={value}
                  checked={scope === value}
                  onChange={() => setScope(value)}
                />
                {text}
              </label>
            ))}
          </fieldset>
          <button
            className="button"
            type="button"
            disabled={!replacement}
            onClick={async () => {
              await onReplace(reason, scope, replacement);
              setOpen(false);
            }}
          >
            Use this replacement
          </button>
        </>
      ) : null}
    </section>
  );
}
function SetLogger({
  data,
  busy,
  message,
  rest,
  setRest,
  onAct,
  onInfo,
}: {
  data: Data;
  busy: boolean;
  message: string;
  rest: number;
  setRest: (value: number) => void;
  onAct: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onInfo: (exercise: Exercise) => void;
}) {
  const next = data.next!,
    e = next.exercise,
    last = data.lastPerformance;
  const [load, setLoad] = useState(last?.load ? String(last.load) : ""),
    [reps, setReps] = useState(String(last?.reps ?? e.repMin)),
    [effort, setEffort] = useState(String(e.rir));
  const completed = (data.sets ?? []).filter(
    (item) => item.exercise_slug === e.exerciseSlug,
  );
  return (
    <section className="workout-screen active-workout">
      <header className="session-context">
        <div>
          <p className="eyebrow">{data.workout!.name}</p>
          <span>
            Exercise {next.exerciseIndex + 1} of{" "}
            {data.workout!.exercises.length} · Set {next.setOrdinal} of {e.sets}
          </span>
        </div>
        <button
          className="text-button"
          onClick={() =>
            void onAct({
              action: "short_time",
              sessionId: data.session!.id,
              availableMinutes: 25,
            })
          }
        >
          Short on time?
        </button>
      </header>
      <h1>{e.exerciseName}</h1>
      <div className="plain-target">
        <strong>
          Aim for {e.repMin}–{e.repMax} reps.
        </strong>
        <span>
          Stop when you feel like you could still do about {e.rir} good reps.
        </span>
      </div>
      <div className="load-guidance">
        {last ? (
          <>
            <span>
              Last time{" "}
              <strong>
                {last.load} lb × {last.reps}
              </strong>
            </span>
            <span>
              Today{" "}
              <strong>
                Start with {last.load} lb · {e.repMin}–{e.repMax} reps
              </strong>
            </span>
          </>
        ) : (
          <p>
            Choose a weight you think you can lift for about{" "}
            {Math.min(8, e.repMax)} good reps. Keep the first set
            conservative—we’ll adjust from there.
          </p>
        )}
      </div>
      {completed.length ? (
        <div className="logged-sets" aria-label="Completed sets">
          {completed.map((item) => (
            <span key={item.set_ordinal}>
              ✓ Set {item.set_ordinal} — {Number(item.load_value)} lb ×{" "}
              {item.repetitions}
            </span>
          ))}
        </div>
      ) : null}
      {rest > 0 ? (
        <div className="rest-timer" role="timer">
          <span>Rest before your next set</span>
          <strong>
            {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
          </strong>
          <small>
            Next: Set {next.setOrdinal} of {e.sets}
          </small>
          <button onClick={() => setRest(0)}>Skip rest</button>
        </div>
      ) : null}
      <div className="set-entry">
        <label>
          Weight{" "}
          <span>
            <input
              aria-label="Weight in pounds"
              type="number"
              min="0"
              inputMode="decimal"
              value={load}
              placeholder="—"
              onChange={(event) => setLoad(event.target.value)}
            />
            <small>lb</small>
          </span>
        </label>
        <label>
          Reps{" "}
          <input
            aria-label="Repetitions"
            type="number"
            min="1"
            max="200"
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
          />
        </label>
      </div>
      <fieldset className="effort-picker">
        <legend>How many more good reps could you do?</legend>
        <div>
          {["0", "1", "2", "3", "4+"].map((value) => (
            <button
              type="button"
              aria-pressed={effort === value}
              className={effort === value ? "selected" : ""}
              key={value}
              onClick={() => setEffort(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <small>
          Choose your best estimate. This helps STHENO adjust future sets.
        </small>
      </fieldset>
      <div className="workout-actions">
        <button
          className="button log-set"
          disabled={busy || load === "" || Number(reps) < 1}
          onClick={async () => {
            const result = await onAct({
              action: "set",
              sessionId: data.session!.id,
              idempotencyKey: crypto.randomUUID(),
              exerciseSlug: e.exerciseSlug,
              setOrdinal: next.setOrdinal,
              load: Number(load),
              reps: Number(reps),
              rir: effort === "4+" ? 4 : Number(effort),
              state: "completed",
              prescribed: e,
            });
            if (result.saved) setRest(e.restSeconds);
          }}
        >
          Log set
        </button>
        <button className="button secondary" onClick={() => onInfo(e)}>
          Exercise info
        </button>
      </div>
      <AdjustmentMenu
        exercise={e}
        onReplace={(reason, scope, replacement) =>
          onAct({
            action: "replace",
            sessionId: data.session!.id,
            exerciseSlug: e.exerciseSlug,
            replacementSlug: replacement,
            reason,
            scope,
            confirmedSafety: reason === "discomfort",
          })
        }
      />
      {message ? (
        <p className="safety-note" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
export function WorkoutExperience() {
  const [data, setData] = useState<Data | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [rest, setRest] = useState(0),
    [info, setInfo] = useState<{
      exercise: ExerciseInfo;
      alternatives: string[];
    } | null>(null),
    [summary, setSummary] = useState<Record<string, number> | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/workouts/today", { cache: "no-store" });
    setData(await response.json());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (rest < 1) return;
    const timer = setInterval(
      () => setRest((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [rest]);
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/workouts/today", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
      body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.error ?? "That change didn’t save. Please try again.");
      return body;
    }
    if (body.safety) setMessage(body.safety.message);
    if (body.summary) setSummary(body.summary);
    else await load();
    return body;
  }
  async function showInfo(exercise: Exercise) {
    const response = await fetch(`/api/exercises/${exercise.exerciseSlug}`),
      body = await response.json();
    if (!response.ok) {
      setMessage("Exercise guidance isn’t available right now.");
      return;
    }
    setInfo({ exercise: body.exercise, alternatives: exercise.alternatives });
  }
  if (!data)
    return (
      <div className="assessment-loading">
        <span className="spinner" />
        Loading today&apos;s training…
      </div>
    );
  if (summary)
    return (
      <section className="workout-screen workout-complete">
        <p className="eyebrow">Workout complete</p>
        <h1>Strong work.</h1>
        <div className="summary-grid">
          <article>
            <span>Time</span>
            <strong>{summary.durationMinutes} min</strong>
          </article>
          <article>
            <span>Sets</span>
            <strong>
              {summary.completedSets}/{summary.prescribedSets}
            </strong>
          </article>
          <article>
            <span>Adherence</span>
            <strong>{summary.adherencePercent}%</strong>
          </article>
        </div>
        <button
          className="button"
          onClick={() => {
            setSummary(null);
            void load();
          }}
        >
          Done
        </button>
      </section>
    );
  if (data.state === "no_program")
    return (
      <section className="workout-screen">
        <p className="eyebrow">Today</p>
        <h1>Your workout starts with a program.</h1>
        <p className="lede">
          Complete your assessment and STHENO will build your first program.
        </p>
        <a className="button" href="/app/program">
          Build my program
        </a>
      </section>
    );
  const workout = data.workout!;
  if (data.state === "preview")
    return (
      <section className="workout-screen workout-preview">
        <p className="eyebrow">Up next · {workout.estimatedMinutes} min</p>
        <h1>{workout.name}</h1>
        <p className="lede">{label(workout.focus)}</p>
        <ol className="workout-list">
          {workout.exercises.map((exercise, index) => (
            <li key={exercise.exerciseSlug}>
              <span>0{index + 1}</span>
              <strong>{exercise.exerciseName}</strong>
              <small>
                {exercise.sets} sets · {exercise.repMin}–{exercise.repMax} reps
                · finish with about {exercise.rir} good reps left
              </small>
            </li>
          ))}
        </ol>
        <button
          disabled={busy}
          className="button"
          onClick={() =>
            void act({ action: "start", clientSessionKey: crypto.randomUUID() })
          }
        >
          Start workout
        </button>
      </section>
    );
  if (!data.next)
    return (
      <section className="workout-screen">
        <p className="eyebrow">Session complete</p>
        <h1>All sets logged.</h1>
        <button
          className="button"
          disabled={busy}
          onClick={() =>
            void act({ action: "complete", sessionId: data.session!.id })
          }
        >
          Finish workout
        </button>
      </section>
    );
  return (
    <>
      <SetLogger
        key={`${data.next.exercise.exerciseSlug}-${data.next.setOrdinal}`}
        data={data}
        busy={busy}
        message={message}
        rest={rest}
        setRest={setRest}
        onAct={act}
        onInfo={showInfo}
      />
      {info ? (
        <ExerciseGuide
          exercise={info.exercise}
          alternatives={info.alternatives}
          onClose={() => setInfo(null)}
        />
      ) : null}
    </>
  );
}
