import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: true },
};

export default function VerifyEmail() {
  return (
    <AuthCard
      title="Check your email"
      subtitle="Confirm your email address to finish signing in. Your assessment and Blueprint are already saved in this browser."
    >
      <p className="form-message" role="status">We sent a confirmation link to the email address you entered.</p>
      <p className="muted">After confirmation, the secure link takes you directly into STHENO.</p>
      <Link className="button" href="/login">I already confirmed my email</Link>
    </AuthCard>
  );
}
