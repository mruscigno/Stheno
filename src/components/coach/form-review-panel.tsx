"use client";

import { useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { FORM_REVIEW_CONSENT_VERSION, FORM_REVIEW_MAX_BYTES, type FormReviewResult } from "@/modules/form-review/contracts";

const exercises = [
  { slug: "goblet-squat", name: "Goblet Squat", view: "front three-quarter or side" },
  { slug: "barbell-rdl", name: "Barbell Romanian Deadlift", view: "side" },
  { slug: "lat-pulldown", name: "Lat Pulldown", view: "front" },
  { slug: "dumbbell-bench-press", name: "Dumbbell Bench Press", view: "front three-quarter" },
  { slug: "one-arm-dumbbell-row", name: "One-Arm Dumbbell Row", view: "rear three-quarter" },
] as const;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function FormReviewPanel() {
  const [exerciseId, setExerciseId] = useState<string>(exercises[0]?.slug ?? "goblet-squat");
  const [cameraView, setCameraView] = useState("unknown");
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [consent, setConsent] = useState(false);
  const [reviewId, setReviewId] = useState<string>();
  const [result, setResult] = useState<FormReviewResult>();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => exercises.find((exercise) => exercise.slug === exerciseId) ?? exercises[0], [exerciseId]);

  function choose(next: File) {
    setError("");
    if (next.size > FORM_REVIEW_MAX_BYTES || !["video/mp4", "video/quicktime"].includes(next.type)) {
      setError("Choose an MP4 or MOV video under 50 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(undefined);
  }

  async function poll(nextReviewId: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await wait(4000);
      const response = await fetch(`/api/v1/coach/form-reviews/${nextReviewId}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load review status.");
      const review = body.review;
      if (["completed", "abstained"].includes(review.processing_status)) {
        setResult(review.structured_result);
        window.dispatchEvent(new CustomEvent("stheno:form-review-ready", { detail: { reviewId: nextReviewId } }));
        setStatus(review.processing_status === "abstained" ? "Review completed with limited evidence." : "Review complete.");
        return;
      }
      if (["failed", "deleted", "expired"].includes(review.processing_status)) throw new Error("The review could not be completed. Your quota is not charged for failed processing.");
      setStatus("Private review is processing. You can leave this page and return later.");
    }
    setStatus("Review is still queued. Return to Coach later to see the result.");
  }

  async function submit() {
    if (!file || !consent || !preview) return;
    setStatus("Preparing private upload…");
    setError("");
    try {
      const intentResponse = await fetch("/api/v1/coach/form-reviews/upload-intent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ exerciseId, cameraView, fileName: file.name, byteSize: file.size, mediaType: file.type, consentVersion: FORM_REVIEW_CONSENT_VERSION, consentAccepted: true, question: question || undefined, idempotencyKey: crypto.randomUUID() }) });
      const intent = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intent.error ?? "Unable to prepare upload.");
      setReviewId(intent.reviewId);
      setStatus("Uploading privately…");
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Private upload is unavailable.");
      const upload = await supabase.storage.from("coach-form-videos").uploadToSignedUrl(intent.path, intent.token, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
      const duration = await new Promise<number>((resolve, reject) => { const video = document.createElement("video"); video.preload = "metadata"; video.onloadedmetadata = () => resolve(video.duration); video.onerror = () => reject(new Error("Unable to read video duration.")); video.src = preview; });
      setStatus("Validating clip…");
      const reviewResponse = await fetch("/api/v1/coach/form-reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: intent.reviewId, durationSeconds: duration }) });
      const review = await reviewResponse.json();
      if (!reviewResponse.ok) throw new Error(review.error ?? "Unable to submit review.");
      if (review.status === "queued") { setStatus("Queued for private review."); await poll(intent.reviewId); }
      else { setResult(review.review); window.dispatchEvent(new CustomEvent("stheno:form-review-ready", { detail: { reviewId: intent.reviewId } })); setStatus("Review safely abstained because processing is not enabled."); }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit form review.");
      setStatus("");
    }
  }

  async function deleteReview() {
    if (!reviewId) return;
    const response = await fetch(`/api/v1/coach/form-reviews/${reviewId}`, { method: "DELETE" });
    if (!response.ok) { setError("Unable to delete the private review."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(undefined); setPreview(undefined); setReviewId(undefined); setResult(undefined); setStatus("Private video and review deleted.");
  }

  return <section className="form-review-panel" aria-labelledby="form-review-title">
    <div><p className="eyebrow">Private pilot · recorded form review</p><h2 id="form-review-title">Review my exercise form</h2><p>Upload one private set, up to 30 seconds and 50 MB. STHENO analyzes up to 12 sampled still frames with OpenAI. Audio is not sent. Video is automatically deleted within 30 days.</p></div>
    <label>Exercise<select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>{exercises.map((exercise) => <option key={exercise.slug} value={exercise.slug}>{exercise.name}</option>)}</select></label>
    <p className="form-review-guidance">Recommended view: {selected?.view}. Keep your full body and equipment visible.</p>
    <label>Camera view<select value={cameraView} onChange={(event) => setCameraView(event.target.value)}><option value="unknown">Not sure</option><option value="front">Front</option><option value="side">Side</option><option value="rear">Rear</option></select></label>
    <label>Optional question<input value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} placeholder="Can you check my RDL setup?" /></label>
    <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>{file ? "Choose a different clip" : "Choose MP4 or MOV"}</button>
    <input ref={inputRef} hidden type="file" accept="video/mp4,video/quicktime,.mov" onChange={(event) => { const next = event.target.files?.[0]; if (next) choose(next); }} />
    {preview ? <video controls playsInline preload="metadata" src={preview} aria-label="Private video preview" /> : null}
    <label className="form-review-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to private storage and AI analysis of sampled frames by OpenAI. The review is optional; it cannot diagnose injury or guarantee safety. I can delete the video and feedback at any time.</span></label>
    <div className="form-review-actions"><button className="button" type="button" disabled={!file || !consent || Boolean(status)} onClick={() => void submit()}>Submit private clip</button>{reviewId ? <button className="button secondary" type="button" onClick={() => void deleteReview()}>Delete review</button> : null}</div>
    {result ? <div className="form-review-result"><h3>{result.abstained ? "We need a clearer recording" : "Your form review"}</h3>{result.positives.length ? <><h4>What looked consistent</h4><ul>{result.positives.map((item) => <li key={item}>{item}</li>)}</ul></> : null}{result.priorities.length ? <><h4>Highest-priority cues</h4><ol>{result.priorities.map((item) => <li key={item}>{item}</li>)}</ol></> : null}<h4>Limits</h4><ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>{result.recommended_camera_view ? <p>Suggested re-recording view: {result.recommended_camera_view}</p> : null}<p className="safety-note">{result.caution_note}</p></div> : null}
    {status ? <p role="status">{status}</p> : null}{error ? <p role="alert" className="safety-note">{error}</p> : null}
  </section>;
}
