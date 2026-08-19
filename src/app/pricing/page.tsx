import type { Metadata } from "next";
import Link from "next/link";
import { TrackedButton } from "@/components/analytics/tracked-link";
import { publicMetadata } from "@/lib/seo";
import { annualSavings, membership } from "@/modules/commerce/product";

export const metadata: Metadata = publicMetadata({ title: "STHENO Membership", description: `Personalized training, nutrition guidance, and adaptive coaching from ${membership.monthly.label} monthly after a ${membership.trialDays}-day account trial.`, path: "/pricing" });
const benefits = ["A training plan built around your schedule and equipment", "Today’s workout with targets, cues, and easy substitutions", "Nutrition targets explained in plain language", "Weekly progress and recovery adjustments", "STHENO Coach for questions and plan changes", "Cancel or manage billing from your account"];

export default function Pricing() { return <main className="pricing-page">
  <header className="pricing-hero chrome-shell"><p className="kicker">Simple membership</p><h1>One plan.<br/>Everything connected.</h1><p>Your complete {membership.trialDays}-day trial starts when you create your STHENO account. Choose a membership any time to keep access after it ends.</p></header>
  <section className="pricing-options chrome-shell">
    <article><span>Pay monthly</span><div className="price"><strong>{membership.monthly.label}</strong><small>/ {membership.monthly.interval}</small></div><p>Flexible month-to-month access after your free trial.</p><form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value="monthly"/><TrackedButton event="pricing_checkout_click" eventProperties={{ plan: "monthly" }} className="button button-large">Choose monthly →</TrackedButton></form><small className="checkout-trust">Secure checkout powered by Stripe</small></article>
    <article className="recommended"><b>BEST VALUE · SAVE ${annualSavings} / YEAR</b><span>Pay annually</span><div className="price"><strong>{membership.annual.label}</strong><small>/ {membership.annual.interval}</small></div><p>Equivalent to ${(membership.annual.amount/12).toFixed(2)}/month after your free trial.</p><form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value="annual"/><TrackedButton event="pricing_checkout_click" eventProperties={{ plan: "annual" }} className="button button-large">Choose annual →</TrackedButton></form><small className="checkout-trust">Secure checkout powered by Stripe</small></article>
  </section>
  <section className="pricing-benefits chrome-shell"><div><p className="kicker">Included</p><h2>Know what to do—and what changes next.</h2></div><ul>{benefits.map(x=><li key={x}><span>✓</span>{x}</li>)}</ul></section>
  <section className="pricing-note chrome-shell"><div><h2>Not ready for membership?</h2><p>Create an account to begin the complete {membership.trialDays}-day trial. No payment method is required to start.</p></div><Link className="button secondary" href="/assessment">Build my free plan</Link></section>
  </main>; }
