"use client";
import { FormEvent, useState } from "react";

export function FoundingFeedbackForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const checked = (name: string) => form.get(name) === "on";
    const response = await fetch("/api/founding-feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ feedback: form.get("feedback"), consistencyHelped: checked("consistencyHelped"), travelAdaptationUsed: checked("travelAdaptationUsed"), scheduleAdaptationUsed: checked("scheduleAdaptationUsed"), equipmentSubstitutionUsed: checked("equipmentSubstitutionUsed"), decisionFatigueReduced: checked("decisionFatigueReduced"), permissionToQuote: checked("permissionToQuote"), permissionForCaseStudy: checked("permissionForCaseStudy"), permissionForOutcomeMetrics: checked("permissionForOutcomeMetrics") }) });
    const data = await response.json(); setMessage(response.ok ? "Thank you. Your private feedback has been saved." : data.error ?? "Feedback could not be saved.");
    if (response.ok) event.currentTarget.reset(); setBusy(false);
  }
  return <form className="founding-feedback" onSubmit={submit}>
    <label>What helped—or got in the way?<textarea required minLength={10} maxLength={4000} name="feedback" rows={6}/></label>
    <fieldset><legend>What did you use?</legend><label><input type="checkbox" name="scheduleAdaptationUsed"/> Schedule or missed-workout adjustment</label><label><input type="checkbox" name="travelAdaptationUsed"/> Travel adaptation</label><label><input type="checkbox" name="equipmentSubstitutionUsed"/> Equipment substitution</label><label><input type="checkbox" name="consistencyHelped"/> STHENO helped me stay consistent</label><label><input type="checkbox" name="decisionFatigueReduced"/> STHENO reduced decision fatigue</label></fieldset>
    <fieldset><legend>Optional permissions</legend><p>Feedback stays private unless you explicitly permit a use below. Access never depends on positive feedback.</p><label><input type="checkbox" name="permissionToQuote"/> You may quote my genuine feedback</label><label><input type="checkbox" name="permissionForCaseStudy"/> You may contact me about a case study</label><label><input type="checkbox" name="permissionForOutcomeMetrics"/> You may use outcome metrics I voluntarily provide</label></fieldset>
    <button className="button" disabled={busy}>{busy ? "Saving…" : "Share private feedback"}</button><p role="status">{message}</p>
  </form>;
}
