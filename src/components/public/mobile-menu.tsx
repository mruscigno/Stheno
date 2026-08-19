"use client";
import Link from "next/link";
import { useState } from "react";
import type { PublicAuthState } from "@/components/public/use-auth-state";
const links = [
  ["/how-it-works", "How it works"],
  ["/methodology", "Methodology"],
  ["/insights", "Learn"],
  ["/faq", "FAQ"],
  ["/tools", "Free tools"],
  ["/pricing", "Pricing"],
  ["/compare", "Compare"],
  ["/about", "About"],
] as const;
export function MobileMenu({ authState }: { authState: PublicAuthState }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-menu">
      <button
        className="mobile-menu-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      {open ? (
        <nav
          className="mobile-menu-panel"
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          {links.map(([href, label]) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          {authState === "signed-in" ? (
            <>
              <Link href="/app" onClick={() => setOpen(false)}>My STHENO</Link>
              <Link className="button" href="/app/account" onClick={() => setOpen(false)}>Account</Link>
            </>
          ) : authState === "signed-out" ? (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
              <Link className="button" href="/assessment" onClick={() => setOpen(false)}>Build my free plan</Link>
            </>
          ) : (
            <span className="session-placeholder" aria-label="Checking account status" />
          )}
        </nav>
      ) : null}
    </div>
  );
}
