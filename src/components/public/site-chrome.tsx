"use client";

import Link from "next/link";
import { MobileMenu } from "@/components/public/mobile-menu";
import { usePublicAuthState } from "@/components/public/use-auth-state";
import { TrackedLink } from "@/components/analytics/tracked-link";
export function SiteHeader() {
  const authState = usePublicAuthState();
  return (
    <header className="global-header">
      <div className="chrome-shell">
        <Link className="brand" href="/" aria-label="STHENO Fitness home">
          <span className="brand-mark">S</span>
          <span>
            STHENO<small>FITNESS</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/how-it-works">How it works</Link>
          <TrackedLink event="nav_methodology_click" href="/methodology">Methodology</TrackedLink>
          <Link href="/insights">Learn</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/tools">Free tools</Link>
          <Link href="/pricing">Pricing</Link>
          <TrackedLink event="nav_about_click" href="/about">About</TrackedLink>
        </nav>
        <div className="header-actions">
          {authState === "signed-in" ? (
            <>
              <Link className="header-auth-link" href="/app">My STHENO</Link>
              <Link className="button button-compact" href="/app/account">Account</Link>
            </>
          ) : authState === "signed-out" ? (
            <>
              <Link className="header-auth-link" href="/login">Sign in</Link>
              <Link className="button button-compact" href="/assessment">Build my free plan</Link>
            </>
          ) : (
            <span className="session-placeholder" aria-label="Checking account status" />
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
            <span className="brand-mark">S</span>
            <span>
              STHENO<small>FITNESS</small>
            </span>
          </Link>
          <p>Your fitness. Handled.</p>
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
              <Link href="/login">Sign in</Link>
            </>
          ) : null}
          <Link href="/contact">Contact</Link>
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
        <span>Educational guidance—not medical care.</span>
      </div>
    </footer>
  );
}
