import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSIONS } from "@/lib/legal";

export const metadata = { title: "Privacy Policy", description: "How STHENO Fitness collects, uses, and protects personal information." };

export default function PrivacyPage() {
  return <LegalPage eyebrow={`Privacy · version ${LEGAL_VERSIONS.privacy} · effective ${LEGAL_EFFECTIVE_DATE}`} title="Privacy Policy" summary="This policy describes the information STHENO uses to provide accounts, personalized fitness guidance, billing, communications, analytics, and security.">
    <h2>Information we collect</h2><p>We collect account identifiers, profile information, assessment answers, workout and progress records, nutrition preferences, support messages, consent records, device and usage data, and subscription status. Stripe processes payment details; STHENO does not store complete card numbers.</p>
    <h2>How we use information</h2><p>We use information to authenticate accounts, generate and adapt fitness guidance, operate workouts and check-ins, send requested service reminders, process billing, secure and troubleshoot the service, measure funnel performance, and meet legal obligations.</p>
    <h2>Sensitive fitness information</h2><p>Assessment free text, safety or medical responses, and Coach messages are used to provide the service and are excluded from analytics event properties. STHENO does not claim HIPAA compliance and should not be used to transmit emergency information.</p>
    <h2>Providers and disclosures</h2><p>We use service providers including Supabase for authentication and data storage, Vercel for hosting, Stripe for billing, Resend for email, and configured analytics and error-monitoring providers. They receive information needed to perform their services. We may disclose information when required by law, to protect safety or rights, or in connection with a business transaction.</p>
    <h2>Retention and security</h2><p>We retain information while your account is active and as reasonably needed for service, security, billing, dispute, and legal purposes. We use access controls and encryption provided by our infrastructure, but no system can guarantee absolute security.</p>
    <h2>Your choices</h2><p>You can update account information, export account data, request deletion, manage billing, and unsubscribe from optional communications. Some billing, fraud, consent, and legal records may be retained when required.</p>
    <h2>Children, changes, and contact</h2><p>STHENO is not directed to children under 16. Material changes will update the version and effective date. Submit privacy questions or requests through the <Link href="/contact">contact page</Link>.</p>
  </LegalPage>;
}

