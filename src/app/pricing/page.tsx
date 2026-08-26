import type { Metadata } from "next";
import Link from "next/link";
import {
  TrackView,
  TrackedButton,
  TrackedLink,
} from "@/components/analytics/tracked-link";
import {
  breadcrumbJsonLd,
  publicMetadata,
  safeJsonLd,
  serviceJsonLd,
} from "@/lib/seo";
import { annualSavings, membership } from "@/modules/commerce/product";

export const metadata: Metadata = publicMetadata({
  title: `Pricing | Adaptive Fitness from ${membership.monthly.label}/mo`,
  description: `Keep training and nutrition aligned when schedules, travel, equipment, and progress change after a ${membership.trialDays}-day trial.`,
  path: "/pricing",
});
const benefits = [
  "A training plan built around your schedule and equipment",
  "Short-on-time workouts that preserve the priority work",
  "Travel and equipment substitutions without starting over",
  "Nutrition targets explained in plain language",
  "Weekly progress and recovery decisions",
  "Cancel or manage billing from your account",
];

export default function Pricing() {
  return (
    <main className="pricing-page">
      <TrackView
        event="money_back_guarantee_viewed"
        eventProperties={{ location: "pricing" }}
      />
      <header className="pricing-hero chrome-shell">
        <p className="kicker">Your fitness. Handled.</p>
        <h1>A fitness plan that changes when your life does.</h1>
        <p>
          Your complete {membership.trialDays}-day trial starts when you create
          your account. STHENO keeps training and nutrition aligned as
          schedules, equipment, travel, and progress change.
        </p>
      </header>
      <p className="pricing-value-anchor chrome-shell">
        You do the work. STHENO handles the plan—for less than the cost of a
        typical personal training session.
      </p>
      <section className="pricing-options chrome-shell">
        <article>
          <span>Pay monthly</span>
          <div className="price">
            <strong>{membership.monthly.label}</strong>
            <small>/ {membership.monthly.interval}</small>
          </div>
          <p>Flexible month-to-month access after your free trial.</p>
          <form action="/api/billing/checkout" method="post">
            <input type="hidden" name="plan" value="monthly" />
            <TrackedButton
              event="pricing_checkout_click"
              eventProperties={{ plan: "monthly" }}
              className="button button-large"
            >
              Choose monthly →
            </TrackedButton>
          </form>
          <small className="checkout-trust">
            Secure checkout powered by Stripe
          </small>
          <p className="guarantee-note">
            <strong>30-day money-back guarantee</strong>
            <span>
              Request a refund of your first paid charge within 30 days.{" "}
              <Link href="/terms">Terms apply.</Link>
            </span>
          </p>
        </article>
        <article className="recommended">
          <b>BEST VALUE · SAVE ${annualSavings} / YEAR</b>
          <span>Pay annually</span>
          <div className="price">
            <strong>{membership.annual.label}</strong>
            <small>/ {membership.annual.interval}</small>
          </div>
          <p>
            Equivalent to ${(membership.annual.amount / 12).toFixed(2)}/month
            after your free trial.
          </p>
          <form action="/api/billing/checkout" method="post">
            <input type="hidden" name="plan" value="annual" />
            <TrackedButton
              event="pricing_checkout_click"
              eventProperties={{ plan: "annual" }}
              className="button button-large"
            >
              Choose annual →
            </TrackedButton>
          </form>
          <small className="checkout-trust">
            Secure checkout powered by Stripe
          </small>
          <p className="guarantee-note">
            <strong>30-day money-back guarantee</strong>
            <span>
              Request a refund of your first paid charge within 30 days.{" "}
              <Link href="/terms">Terms apply.</Link>
            </span>
          </p>
        </article>
      </section>
      <section className="pricing-benefits chrome-shell">
        <div>
          <p className="kicker">Included</p>
          <h2>Your week changed. Your plan can too.</h2>
        </div>
        <ul>
          {benefits.map((x) => (
            <li key={x}>
              <span>✓</span>
              {x}
            </li>
          ))}
        </ul>
      </section>
      <section className="pricing-note chrome-shell">
        <div>
          <h2>Not ready for membership?</h2>
          <p>
            Create an account to begin the complete {membership.trialDays}-day
            trial. No payment method is required to start.
          </p>
          <TrackedLink
            event="compare_click"
            eventProperties={{ location: "pricing" }}
            className="pricing-compare"
            href="/compare"
          >
            Compare STHENO with other fitness support →
          </TrackedLink>
        </div>
        <Link className="button secondary" href="/assessment">
          Build my free plan
        </Link>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd([
            serviceJsonLd("/pricing"),
            breadcrumbJsonLd([
              ["Home", "/"],
              ["Pricing", "/pricing"],
            ]),
          ]),
        }}
      />
    </main>
  );
}
