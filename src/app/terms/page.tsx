import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSIONS } from "@/lib/legal";
import { membership } from "@/modules/commerce/product";

export const metadata = {
  title: "Terms of Service",
  description: "Terms governing use of STHENO Fitness.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow={`Terms · version ${LEGAL_VERSIONS.terms} · effective ${LEGAL_EFFECTIVE_DATE}`}
      title="Terms of Service"
      summary="These terms explain the rules for using STHENO Fitness, including accounts, the free trial, subscriptions, and fitness-content limitations."
    >
      <h2>Eligibility and accounts</h2>
      <p>
        You must be at least 16 years old to create an account. If local law
        requires parental or guardian consent, you may use STHENO only with that
        consent. Keep account credentials secure and provide accurate
        information.
      </p>
      <h2>Trial, billing, renewal, and cancellation</h2>
      <p>
        New eligible accounts receive a {membership.trialDays}-day trial without
        a payment method. Continued premium access after the trial requires a
        paid subscription. Monthly and annual subscriptions renew automatically
        at the interval shown during Stripe Checkout until cancelled. You can
        manage or cancel billing from your account through Stripe’s customer
        portal. Cancellation stops future renewal and ordinarily leaves paid
        access available through the current billing period.
      </p>
      <h2>30-day money-back guarantee</h2>
      <p>
        Your first successfully paid STHENO subscription charge is eligible for
        a refund when you submit the request within 30 calendar days after that
        charge. Signed-in members can check eligibility and submit the request
        from Account &gt; 30-day guarantee, or contact support through the{" "}
        <Link href="/contact">contact page</Link>. An approved refund is
        returned to the original payment method, the associated subscription is
        cancelled, and paid access ends. Later renewal charges are not covered
        by this guarantee. This policy does not limit any non-waivable consumer
        rights available under applicable law.
      </p>
      <h2>Fitness content and user responsibility</h2>
      <p>
        STHENO provides educational fitness guidance, not medical diagnosis or
        treatment. Results are not guaranteed. You decide whether an activity is
        appropriate and remain responsible for using suitable equipment, space,
        technique, and professional care when warranted. Review the{" "}
        <Link href="/medical-disclaimer">Fitness &amp; Medical Disclaimer</Link>
        .
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not misuse the service, attempt unauthorized access, interfere with
        other users, scrape protected content, reverse engineer restricted
        systems, or use STHENO to violate law or another person’s rights.
      </p>
      <h2>Intellectual property</h2>
      <p>
        STHENO’s software, brand, original exercise guidance, illustrations, and
        editorial content are protected intellectual property. Your subscription
        grants a personal, limited, non-transferable right to use the service.
      </p>
      <h2>Service changes, termination, and disclaimers</h2>
      <p>
        We may improve, change, suspend, or discontinue features and may
        restrict accounts that violate these terms. The service is provided on
        an “as available” basis. Warranty, liability, and limitation language
        remains subject to qualified legal review; nothing here excludes rights
        or liabilities that cannot legally be excluded.
      </p>
      <h2>Changes and contact</h2>
      <p>
        Material changes will use a new document version and may require renewed
        acknowledgment. Questions can be sent through the{" "}
        <Link href="/contact">contact page</Link>. Governing-law, jurisdiction,
        and arbitration terms are intentionally not stated without owner and
        counsel direction.
      </p>
    </LegalPage>
  );
}
