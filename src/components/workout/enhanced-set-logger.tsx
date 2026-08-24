"use client";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { capture } from "@/lib/analytics/client";

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
type SetLog = {
  id: string;
  exercise_slug: string;
  set_ordinal: number;
  set_type: string;
  load_value: number | null;
  load_unit: "lb" | "kg";
  repetitions: number;
  rir: number | null;
  rpe: number | null;
  is_user_added?: boolean;
  recommendation_id?: string | null;
};
type Recommendation = {
  id: string;
  exercise_slug: string;
  set_ordinal: number;
  recommended_load: number | null;
  load_unit: "lb" | "kg";
  recommended_reps_min: number;
  recommended_reps_max: number;
  confidence: string;
  reason_code: string;
  explanation: string;
};
type HistoricalSet = {
  load: number;
  unit: "lb" | "kg";
  reps: number;
  rir?: number | null;
};
type Data = {
  session?: { id: string; started_at?: string };
  workout: { name: string; exercises: Exercise[] };
  sets?: SetLog[];
  previousPerformance?: Record<string, HistoricalSet[]>;
  recommendations?: Recommendation[];
};
type Draft = { load: string; reps: string; rir: string; setType: string };

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function EnhancedSetLogger({
  data,
  busy,
  message,
  rest,
  setRest,
  onAct,
  onInfo,
  onReplace,
}: {
  data: Data;
  busy: boolean;
  message: string;
  rest: number;
  setRest: (value: number) => void;
  onAct: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onInfo: (exercise: Exercise) => void;
  onReplace: (exercise: Exercise) => ReactNode;
}) {
  const session = data.session!;
  const [elapsed, setElapsed] = useState(0),
    [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
      try {
        return JSON.parse(
          localStorage.getItem(`stheno-workout-${session.id}`) ?? "{}",
        );
      } catch {
        return {};
      }
    }),
    [editing, setEditing] = useState<string | null>(null),
    [added, setAdded] = useState<Record<string, boolean>>({}),
    [finish, setFinish] = useState(false),
    [adjusting, setAdjusting] = useState(false),
    [guided, setGuided] = useState(false),
    [adjustMessage, setAdjustMessage] = useState(""),
    [note, setNote] = useState(""),
    [prMessage, setPrMessage] = useState("");
  useEffect(() => {
    const started = new Date(session.started_at ?? Date.now()).getTime(),
      tick = () =>
        setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session.started_at]);
  useEffect(() => {
    localStorage.setItem(
      `stheno-workout-${session.id}`,
      JSON.stringify(drafts),
    );
  }, [session.id, drafts]);
  useEffect(() => {
    for (const recommendation of data.recommendations ?? [])
      capture(
        recommendation.recommended_load == null
          ? "load_recommendation_unavailable"
          : "load_recommendation_shown",
        {
          exercise_id: recommendation.exercise_slug,
          confidence: recommendation.confidence,
          reason_code: recommendation.reason_code,
        },
      );
  }, [data.recommendations]);
  const totalSets = data.workout.exercises.reduce(
      (sum, exercise) => sum + exercise.sets,
      0,
    ),
    completedSets = (data.sets ?? []).filter(
      (set) => set.set_type !== "warmup",
    ).length;
  const recommendationMap = useMemo(
    () =>
      new Map(
        (data.recommendations ?? []).map((item) => [
          `${item.exercise_slug}-${item.set_ordinal}`,
          item,
        ]),
      ),
    [data.recommendations],
  );
  function defaultDraft(
    exercise: Exercise,
    ordinal: number,
    saved?: SetLog,
  ): Draft {
    const key = `${exercise.exerciseSlug}-${ordinal}`,
      recommendation = recommendationMap.get(key),
      previous =
        data.previousPerformance?.[exercise.exerciseSlug]?.[ordinal - 1];
    return (
      drafts[key] ?? {
        load:
          saved?.load_value == null
            ? recommendation?.recommended_load == null
              ? previous?.load
                ? String(previous.load)
                : recommendation?.reason_code === "BODYWEIGHT_REPS_ONLY"
                  ? "0"
                  : ""
              : String(recommendation.recommended_load)
            : String(saved.load_value),
        reps: String(
          saved?.repetitions ??
            recommendation?.recommended_reps_min ??
            exercise.repMin,
        ),
        rir: String(saved?.rir ?? exercise.rir),
        setType: saved?.set_type ?? "working",
      }
    );
  }
  function update(key: string, next: Draft) {
    setDrafts((current) => ({ ...current, [key]: next }));
  }
  async function save(
    exercise: Exercise,
    ordinal: number,
    saved?: SetLog,
    userAdded = false,
  ) {
    const key = `${exercise.exerciseSlug}-${ordinal}`,
      draft = defaultDraft(exercise, ordinal, saved),
      recommendation = recommendationMap.get(key);
    if (draft.load === "" || !draft.reps) return;
    const result = await onAct({
      action: "set",
      sessionId: session.id,
      idempotencyKey: crypto.randomUUID(),
      editSetId: saved?.id,
      exerciseSlug: exercise.exerciseSlug,
      setOrdinal: ordinal,
      load: Number(draft.load),
      reps: Number(draft.reps),
      rir: Number(draft.rir),
      setType: draft.setType,
      state: "completed",
      recommendationId: recommendation?.id,
      clientTimestamp: new Date().toISOString(),
      isUserAdded: userAdded,
      prescribed: exercise,
    });
    if (result.saved) {
      setEditing(null);
      setRest(exercise.restSeconds);
      const accepted =
        recommendation?.recommended_load != null &&
        recommendation.recommended_load === Number(draft.load);
      capture(saved ? "set_edited" : "set_logged", {
        exercise_id: exercise.exerciseSlug,
        set_type: draft.setType,
        used_recommendation: accepted,
        edited_recommendation:
          recommendation?.recommended_load != null && !accepted,
        input_mode: "rir",
      });
      if (recommendation?.recommended_load != null)
        capture(
          accepted
            ? "load_recommendation_accepted"
            : "load_recommendation_overridden",
          {
            exercise_id: exercise.exerciseSlug,
            confidence: recommendation.confidence,
            reason_code: recommendation.reason_code,
          },
        );
      capture("rest_timer_started", { seconds: exercise.restSeconds });
      const prs = result.personalRecords as { type: string }[] | undefined;
      if (prs?.length) {
        setPrMessage(
          `New personal best: ${prs.map((pr) => pr.type.replaceAll("_", " ")).join(", ")}.`,
        );
        capture("pr_earned", {
          exercise_id: exercise.exerciseSlug,
          pr_type: prs[0].type,
        });
      }
    }
  }
  const currentExercise =
    data.workout.exercises.find(
      (exercise) =>
        (data.sets ?? []).filter(
          (set) =>
            set.exercise_slug === exercise.exerciseSlug &&
            set.set_type !== "warmup",
        ).length < exercise.sets,
    ) ?? data.workout.exercises[0];
  async function adjust(
    constraint: "time" | "energy" | "soreness" | "equipment" | "missed_session",
    availableMinutes?: number,
  ) {
    capture("workout_adjustment_started", {
      constraint,
      source_screen: "workout",
    });
    const result = await onAct({
      action: "adjust_today",
      sessionId: session.id,
      constraint,
      availableMinutes,
      scope: "today",
      idempotencyKey: crypto.randomUUID(),
    });
    setAdjustMessage(
      String(result.explanation ?? result.message ?? "Adjustment saved."),
    );
    if (result.workout) {
      capture(
        constraint === "time" ? "workout_shortened" : "workout_adjusted",
        { constraint, source_screen: "workout" },
      );
      setAdjusting(false);
    }
  }
  return (
    <section
      className={`workout-screen active-workout full-session enhanced-logger ${guided ? "guided-mode" : ""}`}
    >
      <header className="session-context">
        <div>
          <p className="eyebrow">{data.workout.name}</p>
          <span>
            {clock(elapsed)} elapsed · {completedSets}/{totalSets} planned sets
          </span>
        </div>
        <div className="session-tools">
          <button
            className="text-button"
            onClick={() => {
              setGuided((value) => !value);
              if (!guided)
                capture("guided_mode_started", { source_screen: "workout" });
            }}
          >
            {guided ? "Full session" : "Guided mode"}
          </button>
          <button className="text-button" onClick={() => setAdjusting(true)}>
            Adjust today
          </button>
        </div>
      </header>
      {guided && currentExercise ? (
        <aside className="guided-focus">
          <p className="eyebrow">Guided mode · Current movement</p>
          <h2>{currentExercise.exerciseName}</h2>
          <p>
            {currentExercise.sets} planned sets · {currentExercise.repMin}–
            {currentExercise.repMax} reps · stop with about{" "}
            {currentExercise.rir} good reps left.
          </p>
          <button onClick={() => onInfo(currentExercise)}>
            Technique and safety guide
          </button>
        </aside>
      ) : null}
      {adjustMessage ? (
        <p className="adaptive-message" role="status">
          {adjustMessage}
        </p>
      ) : null}
      <div
        className="session-progress"
        aria-label={`${completedSets} of ${totalSets} planned sets complete`}
      >
        <i
          style={{
            width: `${Math.min(100, (completedSets / Math.max(1, totalSets)) * 100)}%`,
          }}
        />
      </div>
      {rest > 0 && (
        <div className="rest-timer" role="timer" aria-live="off">
          <span>Rest</span>
          <strong>{clock(rest)}</strong>
          <button onClick={() => setRest(Math.max(0, rest - 15))}>−15s</button>
          <button onClick={() => setRest(rest + 15)}>+15s</button>
          <button
            onClick={() => {
              setRest(0);
              capture("rest_timer_dismissed", {});
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {prMessage && (
        <p className="pr-toast" role="status">
          {prMessage}
          <button
            aria-label="Dismiss personal best message"
            onClick={() => setPrMessage("")}
          >
            ×
          </button>
        </p>
      )}
      <div className="exercise-stack">
        {data.workout.exercises.map((exercise, exerciseIndex) => {
          const completed = (data.sets ?? []).filter(
              (set) => set.exercise_slug === exercise.exerciseSlug,
            ),
            rows = Array.from(
              {
                length: exercise.sets + (added[exercise.exerciseSlug] ? 1 : 0),
              },
              (_, index) => index + 1,
            );
          return (
            <article
              className={`session-exercise ${completed.filter((set) => !set.is_user_added).length >= exercise.sets ? "complete" : ""}`}
              key={exercise.exerciseSlug}
            >
              <header>
                <div>
                  <span>{String(exerciseIndex + 1).padStart(2, "0")}</span>
                  <h2>{exercise.exerciseName}</h2>
                  <p>
                    {exercise.sets} sets · {exercise.repMin}–{exercise.repMax}{" "}
                    reps · finish with about {exercise.rir} reps left
                  </p>
                </div>
                <button type="button" onClick={() => onInfo(exercise)}>
                  Guide
                </button>
              </header>
              <div className="set-table">
                <div className="set-labels enhanced">
                  <span>Set</span>
                  <span>Previous</span>
                  <span>Load</span>
                  <span>Reps</span>
                  <span>Left</span>
                  <span />
                </div>
                {rows.map((ordinal) => {
                  const saved = completed.find(
                      (set) => set.set_ordinal === ordinal,
                    ),
                    key = `${exercise.exerciseSlug}-${ordinal}`,
                    draft = defaultDraft(exercise, ordinal, saved),
                    recommendation = recommendationMap.get(key),
                    previous =
                      data.previousPerformance?.[exercise.exerciseSlug]?.[
                        ordinal - 1
                      ],
                    isEditing = editing === key,
                    locked = Boolean(saved && !isEditing),
                    isAdded = ordinal > exercise.sets;
                  return (
                    <div
                      key={key}
                      className={`set-row enhanced ${saved ? "saved" : ""}`}
                    >
                      <b>{isAdded ? "+" : ordinal}</b>
                      <span className="previous-set">
                        {previous ? `${previous.load} × ${previous.reps}` : "—"}
                      </span>
                      <input
                        aria-label={`${exercise.exerciseName} set ${ordinal} load`}
                        inputMode="decimal"
                        type="number"
                        min="0"
                        value={draft.load}
                        disabled={locked}
                        placeholder="—"
                        onChange={(event) =>
                          update(key, { ...draft, load: event.target.value })
                        }
                      />
                      <input
                        aria-label={`${exercise.exerciseName} set ${ordinal} repetitions`}
                        inputMode="numeric"
                        type="number"
                        min="1"
                        max="500"
                        value={draft.reps}
                        disabled={locked}
                        onChange={(event) =>
                          update(key, { ...draft, reps: event.target.value })
                        }
                      />
                      <select
                        aria-label={`${exercise.exerciseName} set ${ordinal} reps left`}
                        value={draft.rir}
                        disabled={locked}
                        onChange={(event) =>
                          update(key, { ...draft, rir: event.target.value })
                        }
                      >
                        {[0, 1, 2, 3, 4].map((value) => (
                          <option value={value} key={value}>
                            {value === 4 ? "4+" : value}
                          </option>
                        ))}
                      </select>
                      {saved && !isEditing ? (
                        <button
                          className="edit-set"
                          onClick={() => setEditing(key)}
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          disabled={busy || draft.load === "" || !draft.reps}
                          aria-label={`Log ${exercise.exerciseName} set ${ordinal}`}
                          onClick={() =>
                            void save(exercise, ordinal, saved, isAdded)
                          }
                        >
                          {saved ? "Save" : "✓"}
                        </button>
                      )}
                      {recommendation && !saved && (
                        <small className="set-recommendation">
                          <strong>
                            {recommendation.recommended_load == null
                              ? "Starting set"
                              : `Try ${recommendation.recommended_load} ${recommendation.load_unit}`}
                          </strong>{" "}
                          {recommendation.explanation}
                        </small>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="logger-actions">
                <button
                  type="button"
                  onClick={() =>
                    setAdded((current) => ({
                      ...current,
                      [exercise.exerciseSlug]: !current[exercise.exerciseSlug],
                    }))
                  }
                >
                  {added[exercise.exerciseSlug]
                    ? "Remove added set"
                    : "+ Add set"}
                </button>
                {onReplace(exercise)}
              </div>
            </article>
          );
        })}
      </div>
      {message && (
        <p className="sync-message" role="status">
          {message} Your entered values remain on this device.
        </p>
      )}
      <footer className="finish-session">
        <button
          className="button"
          disabled={busy}
          onClick={() => setFinish(true)}
        >
          Finish workout
        </button>
        <small>
          {completedSets < totalSets
            ? `${totalSets - completedSets} planned sets remaining`
            : "All prescribed sets complete"}
        </small>
      </footer>
      {adjusting && (
        <div
          className="effort-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-title"
        >
          <div>
            <button
              className="dialog-close"
              onClick={() => setAdjusting(false)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow">Adjust today</p>
            <h2 id="adjust-title">What changed?</h2>
            <p>
              Choose what is true today. Permanent plan changes require a
              separate confirmation.
            </p>
            <div className="effort-options">
              <button onClick={() => void adjust("time", 25)}>
                I have 25 minutes
              </button>
              <button onClick={() => void adjust("energy")}>Low energy</button>
              <button onClick={() => void adjust("soreness")}>
                More sore than usual
              </button>
              <button onClick={() => void adjust("equipment")}>
                Equipment unavailable
              </button>
              <button onClick={() => void adjust("missed_session")}>
                I missed a session
              </button>
            </div>
          </div>
        </div>
      )}
      {finish && (
        <div
          className="effort-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="effort-title"
        >
          <div>
            <button
              className="dialog-close"
              onClick={() => setFinish(false)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow">Quick check</p>
            <h2 id="effort-title">How did that workout feel?</h2>
            <div className="effort-options">
              {[
                ["too_easy", "Too easy"],
                ["about_right", "About right"],
                ["very_hard", "Very hard"],
                ["couldnt_finish", "Couldn’t finish"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    void onAct({
                      action: "complete",
                      sessionId: session.id,
                      effort: value,
                      note: note || undefined,
                      allowIncomplete: completedSets < totalSets,
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <label>
              Anything we should know? <span>Optional and private</span>
              <textarea
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
