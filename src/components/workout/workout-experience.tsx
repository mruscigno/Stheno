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
  session?: { id: string; started_at?: string };
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
  const workout=data.workout!,next=data.next!,totalSets=workout.exercises.reduce((sum,e)=>sum+e.sets,0),completedSets=(data.sets??[]).length;
  const[elapsed,setElapsed]=useState(0),[drafts,setDrafts]=useState<Record<string,{load:string;reps:string;rir:string}>>(()=>{try{return typeof window==="undefined"?{}:JSON.parse(localStorage.getItem(`stheno-workout-${data.session!.id}`)??"{}")}catch{return{}}}),[collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  useEffect(()=>{const started=new Date(data.session?.started_at??Date.now()).getTime(),tick=()=>setElapsed(Math.max(0,Math.floor((Date.now()-started)/1000)));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer)},[data.session?.started_at]);
  useEffect(()=>{localStorage.setItem(`stheno-workout-${data.session!.id}`,JSON.stringify(drafts))},[data.session!.id,drafts]);
  const format=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
  const update=(key:string,field:"load"|"reps"|"rir",value:string,exercise:Exercise)=>setDrafts(all=>({...all,[key]:{load:all[key]?.load??"",reps:all[key]?.reps??String(exercise.repMin),rir:all[key]?.rir??String(exercise.rir),[field]:value}}));
  return (
    <section className="workout-screen active-workout full-session">
      <header className="session-context">
        <div>
          <p className="eyebrow">{data.workout!.name}</p>
          <span>{format(elapsed)} elapsed · {completedSets}/{totalSets} sets</span>
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
      <div className="session-progress" aria-label={`${completedSets} of ${totalSets} sets complete`}><i style={{width:`${completedSets/totalSets*100}%`}}/></div>
      {rest > 0 ? (
        <div className="rest-timer" role="timer">
          <span>Rest</span><strong>{format(rest)}</strong><button onClick={()=>setRest(rest+30)}>+30s</button><button onClick={() => setRest(0)}>Skip</button>
        </div>
      ) : null}
      <div className="exercise-stack">{workout.exercises.map((e,index)=>{const done=(data.sets??[]).filter(s=>s.exercise_slug===e.exerciseSlug),complete=done.length>=e.sets,isCollapsed=collapsed[e.exerciseSlug]??complete;return <article className={`session-exercise ${complete?"complete":""}`} key={e.exerciseSlug}><header><div><span>{complete?"✓":String(index+1).padStart(2,"0")}</span><h2>{e.exerciseName}</h2><p>{e.sets} sets · {e.repMin}–{e.repMax} reps · {e.rir} left</p></div><div><button type="button" onClick={()=>onInfo(e)}>Info</button>{complete?<button type="button" onClick={()=>setCollapsed(c=>({...c,[e.exerciseSlug]:!isCollapsed}))}>{isCollapsed?"Expand":"Collapse"}</button>:null}</div></header>{isCollapsed?<p className="exercise-summary">{done.map(s=>`${Number(s.load_value)}×${s.repetitions}`).join(" · ")}</p>:<><div className="set-table"><div className="set-labels"><span>Set</span><span>lb</span><span>Reps</span><span>Left</span><span/></div>{Array.from({length:e.sets},(_,i)=>i+1).map(ordinal=>{const saved=done.find(s=>s.set_ordinal===ordinal),key=`${e.exerciseSlug}-${ordinal}`,draft=drafts[key]??{load:"",reps:String(e.repMin),rir:String(e.rir)};return <div className={`set-row ${saved?"saved":""}`} key={key}><b>{saved?"✓":ordinal}</b><input aria-label={`${e.exerciseName} set ${ordinal} weight`} inputMode="decimal" type="number" min="0" placeholder="—" value={saved?String(saved.load_value??""):draft.load} disabled={!!saved} onChange={ev=>update(key,"load",ev.target.value,e)}/><input aria-label={`${e.exerciseName} set ${ordinal} reps`} inputMode="numeric" type="number" min="1" value={saved?String(saved.repetitions):draft.reps} disabled={!!saved} onChange={ev=>update(key,"reps",ev.target.value,e)}/><select aria-label={`${e.exerciseName} set ${ordinal} reps left`} value={saved?String(saved.rir):draft.rir} disabled={!!saved} onChange={ev=>update(key,"rir",ev.target.value,e)}>{[0,1,2,3,4].map(v=><option key={v}>{v}</option>)}</select><button type="button" disabled={busy||!!saved||!draft.load||!draft.reps} aria-label={`Log ${e.exerciseName} set ${ordinal}`} onClick={async()=>{const result=await onAct({action:"set",sessionId:data.session!.id,idempotencyKey:crypto.randomUUID(),exerciseSlug:e.exerciseSlug,setOrdinal:ordinal,load:Number(draft.load),reps:Number(draft.reps),rir:Number(draft.rir),state:"completed",prescribed:e});if(result.saved){setRest(e.restSeconds);setDrafts(all=>{const copy={...all};delete copy[key];return copy})}}}>{saved?"Done":"✓"}</button></div>})}</div><AdjustmentMenu exercise={e} onReplace={(reason,scope,replacement)=>onAct({action:"replace",sessionId:data.session!.id,exerciseSlug:e.exerciseSlug,replacementSlug:replacement,reason,scope,confirmedSafety:reason==="discomfort"})}/></>}</article>})}</div>
      {message ? (
        <p className="sync-message" role="status">{message} Your entered values remain on this device.</p>
      ) : null}
      <footer className="finish-session"><button className="button" disabled={busy||completedSets<totalSets} onClick={()=>void onAct({action:"complete",sessionId:data.session!.id})}>Finish workout</button><small>{completedSets<totalSets?`${totalSets-completedSets} sets remaining`:"All prescribed sets complete"}</small></footer>
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
    try{const response = await fetch("/api/workouts/today", {
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
    }catch{setBusy(false);setMessage("You appear to be offline. Reconnect and tap the set again to sync.");return{saved:false}}
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
