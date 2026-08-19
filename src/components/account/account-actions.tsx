"use client";
import { useState } from "react";

export function AccountActions() {
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  async function exportData() {
    setExporting(true); setMessage("Preparing your private export…");
    (window as Window & { posthog?: { capture: (name: string) => void } }).posthog?.capture("data_export_requested");
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const blob = await response.blob(), url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url; anchor.download = `stheno-data-${new Date().toISOString().slice(0, 10)}.zip`; anchor.click(); URL.revokeObjectURL(url);
      setMessage("Your export is ready and the download has started.");
      (window as Window & { posthog?: { capture: (name: string) => void } }).posthog?.capture("data_export_completed");
    } catch {
      setMessage("Your export could not be completed. Please try again.");
      (window as Window & { posthog?: { capture: (name: string) => void } }).posthog?.capture("data_export_failed");
    } finally { setExporting(false); }
  }
  async function remove() { const response = await fetch("/api/account/delete", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation }) }); const result = await response.json(); setMessage(response.ok ? result.status === "deleted" ? "Your account and associated data were deleted." : "Your deletion request is queued." : result.error); }
  return <section className="card-wide"><h2>Data &amp; privacy</h2><p>Your data is yours. Export the fitness and progress information stored with STHENO as a ZIP containing JSON and readable CSV files.</p><button className="button secondary" type="button" disabled={exporting} onClick={exportData}>{exporting ? "Preparing export…" : "Export my data"}</button><p aria-live="polite">{message}</p><h2>Delete account</h2><p>This permanently removes your account and associated application data. Billing should be cancelled first.</p><label className="field">Type DELETE MY ACCOUNT<input value={confirmation} onChange={(event)=>setConfirmation(event.target.value)}/></label><button className="button secondary" type="button" disabled={confirmation!=="DELETE MY ACCOUNT"} onClick={remove}>Delete my account</button></section>;
}
