"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { capture } from "@/lib/analytics/client";

type Eligibility = {
  eligible: boolean;
  reason?: string | null;
  deadline?: string | null;
  firstPaidAt?: string | null;
};
export function RefundGuarantee() {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null),
    [reason, setReason] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/billing/refund", { cache: "no-store" })
      .then((response) => response.json())
      .then(setEligibility);
  }, []);
  async function submit() {
    if (
      !confirm(
        "Refund your first paid charge and cancel your STHENO subscription now?",
      )
    )
      return;
    setBusy(true);
    setStatus("Submitting securely to Stripe…");
    const response = await fetch("/api/billing/refund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      }),
      body = await response.json();
    setBusy(false);
    setStatus(
      body.message ?? body.error ?? "The request could not be completed.",
    );
    if (response.ok) {
      capture("money_back_refund_completed", { source_screen: "account" });
      setEligibility({
        eligible: false,
        reason: "Your first paid charge has been refunded.",
      });
    }
  }
  if (!eligibility) return <p>Checking guarantee eligibility…</p>;
  return (
    <section className="account-card refund-guarantee">
      <p className="kicker">30-day money-back guarantee</p>
      <h2>
        {eligibility.eligible
          ? "Your first paid charge is eligible."
          : "Guarantee status"}
      </h2>
      {eligibility.eligible ? (
        <>
          <p>
            Requesting a refund will refund the first paid charge to its
            original payment method and immediately cancel membership access.
          </p>
          {eligibility.deadline ? (
            <small>
              Request by {new Date(eligibility.deadline).toLocaleDateString()}.
            </small>
          ) : null}
          <label>
            Reason <span>Optional</span>
            <textarea
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button
            className="button"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Processing…" : "Request refund and cancel"}
          </button>
        </>
      ) : (
        <p>{eligibility.reason}</p>
      )}
      <p role="status">{status}</p>
      <small>
        Questions? <Link href="/contact">Contact STHENO support</Link>.
      </small>
    </section>
  );
}
