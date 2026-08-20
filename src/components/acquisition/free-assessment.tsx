"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Blueprint } from "@/modules/acquisition/blueprint";
import {
  ASSESSMENT_VERSION,
  intakeSteps,
  reviewGroups,
  visibleSteps,
  type Intake,
} from "@/modules/acquisition/assessment-model";
import { ftInToCm, lbToKg } from "@/modules/units/conversions";
import { capture } from "@/lib/analytics/client";
const STORAGE = `stheno_assessment_${ASSESSMENT_VERSION}`;
const initial: Intake = { diet: "flexible", heightFeet: 5, heightInches: 9 };
function restore() {
  if (typeof window === "undefined") return initial;
  try {
    const x = JSON.parse(localStorage.getItem(STORAGE) || "null");
    return x?.version === ASSESSMENT_VERSION
      ? { ...initial, ...x.answers }
      : initial;
  } catch {
    return initial;
  }
}
function shown(value: unknown) {
  if (Array.isArray(value)) return value.join(", ").replaceAll("_", " ");
  return String(value ?? "").replaceAll("_", " ");
}
export function FreeAssessment() {
  const completed = useRef(false);
  const router = useRouter(),
    [answers, setAnswers] = useState<Intake>(restore),
    [index, setIndex] = useState(0),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const steps = visibleSteps(answers),
    step = steps[Math.min(index, steps.length - 1)],
    value = step?.key ? answers[step.key] : undefined;
  useEffect(() => {
    localStorage.setItem(
      STORAGE,
      JSON.stringify({
        version: ASSESSMENT_VERSION,
        answers,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [answers]);
  useEffect(() => { capture("assessment_started", { assessment_version: ASSESSMENT_VERSION }); }, []);
  useEffect(() => { if (step) capture("assessment_step_viewed", { assessment_version: ASSESSMENT_VERSION, step_key: step.key, step_number: index + 1, total_steps: steps.length }); }, [index, step, steps.length]);
  useEffect(() => { const abandon = () => { if (!completed.current) capture("assessment_abandoned", { assessment_version: ASSESSMENT_VERSION, step_key: step?.key ?? "unknown", step_number: index + 1 }); }; window.addEventListener("pagehide", abandon); return () => window.removeEventListener("pagehide", abandon); }, [index, step?.key]);
  function set(v: string | number | string[]) {
    setAnswers((a) => ({ ...a, [step.key]: v }));
  }
  function choose(v: string) {
    const numeric = [
      "days",
      "duration",
      "age",
      "heightFeet",
      "heightInches",
      "weightLb",
      "waistInches",
      "dumbbellLimitLb",
      "sleepHours",
    ].includes(step.key);
    set(numeric ? Number(v) : v);
  }
  function toggle(v: string) {
    const current = Array.isArray(value) ? value : [];
    set(current.includes(v) ? current.filter((x) => x !== v) : [...current, v]);
  }
  function valid() {
    return (
      step.optional ||
      (value !== undefined &&
        value !== "" &&
        (!Array.isArray(value) || value.length > 0))
    );
  }
  function advance() {
    if (!valid()) return;
    capture("assessment_step_completed", { assessment_version: ASSESSMENT_VERSION, step_key: step.key, step_number: index + 1, total_steps: steps.length });
    if (index < steps.length - 1) setIndex((x) => x + 1);
    else setReview(true);
  }
  function edit(key: string) {
    const target = steps.findIndex((x) => x.key === key);
    if (target >= 0) {
      setIndex(target);
      setReview(false);
    }
  }
  async function build() {
    setBusy(true);
    setError("");
    const feet = Number(answers.heightFeet ?? 5),
      inches = Number(answers.heightInches ?? 9),
      weightLb = Number(answers.weightLb ?? 165);
    const payload = {
      ...answers,
      heightCm: ftInToCm(feet, inches),
      weightKg: lbToKg(weightLb),
      currentTraining: answers.currentFrequency,
      experience: answers.experience,
      goal: answers.goal,
      days: answers.days,
      duration: answers.duration,
      diet: answers.diet,
    };
    try {
      capture("assessment_completed", { assessment_version: ASSESSMENT_VERSION, total_steps: steps.length });
      capture("blueprint_generation_started", { assessment_version: ASSESSMENT_VERSION });
      const response = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        blueprint?: Blueprint;
        error?: string;
      };
      if (!response.ok || !data.blueprint) {
        throw new Error(
          data.error ?? "We could not build your Blueprint. Please try again.",
        );
      }
      localStorage.setItem(
        "stheno_blueprint",
        JSON.stringify({
          ...data.blueprint,
          input: payload,
          createdAt: new Date().toISOString(),
        }),
      );
      completed.current = true;
      capture("blueprint_generation_completed", { assessment_version: ASSESSMENT_VERSION, blueprint_version: data.blueprint.version });
      router.push("/blueprint");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not build your Blueprint. Please try again.",
      );
      setBusy(false);
    }
  }
  if (review)
    return (
      <main className="assessment-v2 assessment-review">
        <header>
          <Image className="assessment-logo" src="/stheno-mark.png" alt="STHENO Fitness" width={56} height={56} priority />
          <div>
            <p>Review</p>
            <strong>Here’s what I’m building around.</strong>
          </div>
          <progress value={steps.length} max={steps.length} />
        </header>
        <section>
          <p className="kicker">Your coaching intake · {ASSESSMENT_VERSION}</p>
          <h1>Check the details before I build your Blueprint.</h1>
          <p className="assessment-microcopy">
            Nothing is locked. Edit any answer that does not reflect your real
            life.
          </p>
          <div className="review-groups">
            {reviewGroups(answers).map((group) => (
              <section key={group.section}>
                <h2>{group.section}</h2>
                {group.items.map((item) => (
                  <button
                    type="button"
                    onClick={() => edit(item.key)}
                    key={item.key}
                  >
                    <span>{item.question}</span>
                    <strong>{shown(answers[item.key])}</strong>
                    <i>Edit</i>
                  </button>
                ))}
              </section>
            ))}
          </div>
          {error ? (
            <p role="alert" className="form-message">
              {error}
            </p>
          ) : null}
        </section>
        <footer>
          <button
            type="button"
            className="back"
            onClick={() => {
              setReview(false);
              setIndex(steps.length - 1);
            }}
          >
            ← Back
          </button>
          <button
            className="button button-large"
            type="button"
            disabled={busy}
            onClick={build}
          >
            {busy ? "Building your Blueprint…" : "Everything looks right →"}
          </button>
        </footer>
      </main>
    );
  return (
    <main className="assessment-v2">
      <header>
        <Image className="assessment-logo" src="/stheno-mark.png" alt="STHENO Fitness" width={56} height={56} priority />
        <div>
          <p>{step.section}</p>
          <strong>
            {index + 1} of {steps.length}
          </strong>
        </div>
        <progress value={index + 1} max={steps.length} />
      </header>
      <section key={step.key} className="assessment-stage">
        <p className="kicker">STHENO coaching intake</p>
        <h1>{step.question}</h1>
        <p className="assessment-microcopy">{step.help}</p>
        {step.type === "single" ? (
          <div className="answer-grid">
            {step.options?.map((option) => (
              <button
                type="button"
                className={String(value) === option.value ? "selected" : ""}
                onClick={() => choose(option.value)}
                key={option.value}
              >
                <span>{option.label}</span>
                {option.detail ? <small>{option.detail}</small> : null}
                <i>{String(value) === option.value ? "✓" : "→"}</i>
              </button>
            ))}
          </div>
        ) : step.type === "multi" ? (
          <div className="answer-grid multi">
            {step.options?.map((option) => (
              <button
                type="button"
                className={
                  Array.isArray(value) && value.includes(option.value)
                    ? "selected"
                    : ""
                }
                onClick={() => toggle(option.value)}
                key={option.value}
              >
                <span>{option.label}</span>
                <i>
                  {Array.isArray(value) && value.includes(option.value)
                    ? "✓"
                    : "+"}
                </i>
              </button>
            ))}
          </div>
        ) : step.type === "number" ? (
          <div className="number-answer">
            <input
              inputMode="decimal"
              autoFocus
              type="number"
              min={step.min}
              max={step.max}
              value={typeof value === "number" ? value : ""}
              onChange={(e) => choose(e.target.value)}
            />
            <span>{step.unit}</span>
          </div>
        ) : (
          <textarea
            autoFocus
            rows={6}
            maxLength={step.key === "context" ? 1200 : 600}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => set(e.target.value)}
            placeholder={
              step.key === "context"
                ? "For example: My work schedule changes every other week…"
                : "Type here…"
            }
          />
        )}
      </section>
      <footer>
        <button
          type="button"
          className="back"
          disabled={index === 0}
          onClick={() => setIndex((x) => Math.max(0, x - 1))}
        >
          ← Back
        </button>
        <button
          type="button"
          className="button button-large"
          disabled={!valid()}
          onClick={advance}
        >
          {index === steps.length - 1 ? "Review my answers →" : "Continue →"}
        </button>
        {step.optional && value === undefined ? (
          <button type="button" className="skip" onClick={() => { capture("assessment_step_skipped", { assessment_version: ASSESSMENT_VERSION, step_key: step.key, step_number: index + 1 }); advance(); }}>
            Skip for now
          </button>
        ) : null}
      </footer>
    </main>
  );
}
export { intakeSteps };
