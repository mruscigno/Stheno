"use client";
import Link from "next/link";
import { useState } from "react";
const links = [
  ["/how-it-works", "How it works"],
  ["/how-it-works#training", "Training"],
  ["/how-it-works#nutrition", "Nutrition"],
  ["/tools", "Free tools"],
  ["/insights", "Learn"],
  ["/pricing", "Pricing"],
] as const;
export function MobileMenu() {
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
          <Link href="/login" onClick={() => setOpen(false)}>
            Log in
          </Link>
          <Link
            className="button"
            href="/assessment"
            onClick={() => setOpen(false)}
          >
            Build my free plan
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
