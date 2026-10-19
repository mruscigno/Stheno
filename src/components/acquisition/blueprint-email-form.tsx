"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { captureFunnel, readAttribution } from "@/lib/analytics/funnel-client";
import type { StoredBlueprint } from "@/modules/acquisition/blueprint-storage";

export function BlueprintEmailForm({ blueprint }: { blueprint: StoredBlueprint }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget, values = new FormData(form);
    const marketingConsent = values.get("marketingConsent") === "on";
    const attribution = readAttribution();
    setStatus("sending"); setMessage("");
    void captureFunnel("blueprint_email_requested", { marketing_consent: marketingConsent });
    try {
      const response = await fetch("/api/blueprint/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: values.get("email"), marketingConsent, website: values.get("website"),
          attribution: attribution ? { sessionId: attribution.sessionId, source: attribution.last.source, medium: attribution.last.medium, campaign: attribution.last.campaign } : undefined,
          summary: {
            goalLabel: blueprint.goalLabel, strategy: blueprint.strategy,
            days: blueprint.training.days, focus: blueprint.training.focus,
            structure: blueprint.training.structure, duration: blueprint.training.duration,
            proteinLow: blueprint.nutrition.proteinGrams[0], proteinHigh: blueprint.nutrition.proteinGrams[1],
            calorieDirection: blueprint.nutrition.calorieDirection,
          },
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Email delivery failed.");
      setStatus("sent");
      setMessage("Check your inbox—your Blueprint is on its way.");
      void captureFunnel("blueprint_email_delivered", { marketing_consent: marketingConsent });
      if (marketingConsent) void captureFunnel("blueprint_marketing_consent_granted", { consent_version: "blueprint-marketing-v1" });
      form.reset();
    } catch (cause) {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "Email delivery failed. Please try again.");
      void captureFunnel("blueprint_email_failed", { reason: "request_failed" });
    }
  }

  return (
    <aside className="blueprint-email-panel" aria-labelledby="blueprint-email-heading">
      <div>
        <p className="kicker">Keep your starting point</p>
        <h2 id="blueprint-email-heading">Email my Blueprint</h2>
        <p>Send this training and nutrition summary to your inbox. No account required.</p>
      </div>
      <form className="blueprint-email-form" onSubmit={submit}>
        <label htmlFor="blueprint-email">Email address</label>
        <div className="blueprint-email-row">
          <input id="blueprint-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@example.com" />
          <button className="button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Email my Blueprint"}</button>
        </div>
        <div className="blueprint-email-honeypot" aria-hidden="true"><label htmlFor="blueprint-website">Website</label><input id="blueprint-website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <label className="blueprint-marketing-choice">
          <input name="marketingConsent" type="checkbox" />
          <span>Also send me occasional STHENO training, nutrition, and product emails. I can unsubscribe at any time.</span>
        </label>
        <p className="blueprint-email-privacy">Blueprint delivery does not require marketing consent. See our <Link href="/privacy">Privacy Policy</Link>.</p>
        <p className={`blueprint-email-status ${status}`} role="status" aria-live="polite">{message}</p>
      </form>
    </aside>
  );
}
