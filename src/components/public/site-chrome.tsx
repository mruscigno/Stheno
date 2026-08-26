"use client";

import Link from "next/link";
import { SthenoLogo } from "@/components/brand/stheno-logo";
import { MobileMenu } from "@/components/public/mobile-menu";
import { usePublicAuthState } from "@/components/public/use-auth-state";
import { SocialLinks } from "@/components/public/social-links";
import { TrackedLink } from "@/components/analytics/tracked-link";
export function SiteHeader() {
  const authState = usePublicAuthState();
  return (
    <header className="global-header">
      <div className="chrome-shell">
        <Link className="brand" href="/" aria-label="STHENO Fitness home">
          <SthenoLogo />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/#training">Training</Link>
          <Link href="/#nutrition">Nutrition</Link>
          <Link href="/#progress">Progress</Link>
          <Link href="/pricing">Pricing</Link>
          <TrackedLink
            event="compare_nav_clicked"
            eventProperties={{ location: "desktop_header" }}
            href="/compare"
          >
            Compare
          </TrackedLink>
          <Link href="/insights">Resources</Link>
        </nav>
        <div className="header-actions">
          {authState === "signed-in" ? (
            <>
              <Link className="header-auth-link" href="/app">
                My STHENO
              </Link>
              <Link className="button button-compact" href="/app/account">
                Account
              </Link>
            </>
          ) : authState === "signed-out" ? (
            <>
              <Link className="header-auth-link" href="/login">
                Sign In
              </Link>
              <Link className="button button-compact" href="/assessment">
                Get Your Free Plan
              </Link>
            </>
          ) : (
            <span
              className="session-placeholder"
              aria-label="Checking account status"
            />
          )}
        </div>
        <MobileMenu authState={authState} />
      </div>
    </header>
  );
}
export function SiteFooter() {
  const authState = usePublicAuthState();
  return (
    <footer className="global-footer">
      <div className="chrome-shell footer-grid">
        <div>
          <Link className="brand" href="/">
            <SthenoLogo className="footer-logo" />
          </Link>
          <p>Your fitness. Handled.</p>
          <SocialLinks />
        </div>
        <nav aria-label="Explore">
          <strong>Explore</strong>
          <Link href="/assessment">Free assessment</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/insights">Learn</Link>
          <Link href="/exercises">Exercises</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/compare">Compare</Link>
          <Link href="/about">About</Link>
        </nav>
        <nav aria-label="Account">
          <strong>Account</strong>
          <Link href="/pricing">Pricing</Link>
          {authState === "signed-in" ? (
            <>
              <Link href="/app">My STHENO</Link>
              <Link href="/app/account">Account settings</Link>
            </>
          ) : authState === "signed-out" ? (
            <>
              <Link href="/signup">Create account</Link>
              <Link href="/login">Sign In</Link>
            </>
          ) : null}
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/medical-disclaimer">Medical disclaimer</Link>
        </nav>
        <div>
          <strong>STHENO standard</strong>
          <p>
            Clear guidance, realistic progress, and no shame-based fitness
            advice.
          </p>
        </div>
      </div>
      <div className="chrome-shell footer-bottom">
        <span>© 2026 STHENO Fitness</span>
        <span>
          <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/privacy">Privacy</Link> ·{" "}
          <Link href="/medical-disclaimer">
            Fitness &amp; Medical Disclaimer
          </Link>
        </span>
      </div>
    </footer>
  );
}
