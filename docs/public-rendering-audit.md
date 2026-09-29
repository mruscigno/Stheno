# Public rendering audit

Audit date: 2026-09-29  
Production origin: `https://www.sthenofitness.com`

## Root cause

`HomepageEntryGate` is a client component that checks Supabase authentication, saved assessment state, and the returning-visitor gateway preference. It previously returned a page-level `Loading your STHENO experience...` placeholder while those client checks ran. That made member personalization block the anonymous marketing document and left raw retrievals without the substantive homepage.

The gate now renders the complete server-generated marketing homepage while client state is unresolved. After hydration, it may redirect an authenticated member or display the assessment gateway, but it never replaces the initial document with a blocking loading screen. Components that require client state are therefore enhancements rather than prerequisites for understanding the product.

## Raw production response

The unmodified HTTP response returned status `200`, with a measured TTFB of approximately `0.385s` from the verification environment. Before JavaScript execution, it contained:

- Document title and meta description: **YES**
- Canonical URL: **YES**
- H1, `A fitness plan that changes when your life does.`: **YES**
- Supporting product copy: **YES**
- Primary assessment link: **YES**
- Training, nutrition, progress, and adaptation content: **YES**
- Meaningful internal links: **YES**
- Footer: **YES**
- JSON-LD structured data: **YES**
- `Loading your STHENO experience...`: **NO**

This is also the JavaScript-disabled representation: an anonymous visitor or crawler can understand what STHENO is, what it does, and how to start the assessment without executing the client bundle.

## Anonymous and member behavior

- New anonymous visitor: receives the complete marketing HTML, then the goal/assessment gateway after hydration.
- Returning anonymous visitor: receives the same complete marketing HTML; saved assessment state can enhance the client experience with a continuation action.
- Authenticated member: receives the complete initial document and is redirected to `/app` after session resolution.
- Member initialization does not block the anonymous marketing response.

## CTA verification

At a 390 × 844 mobile viewport, the anonymous gateway displayed a readable H1, six labeled goal controls, and an `Explore STHENO first` action. Selecting `Build muscle` navigated successfully to `/assessment`. The action does not wait for account, subscription, or dashboard initialization.

## Library and cache state

- Authoritative production database count: **567**
- Public exercise query source: the production Supabase `exercises` table, filtered to reviewed, indexable, production-ready records.
- Current Vercel deployment and both custom-domain aliases use the same build.
- Repository and production searches contain no current `20 launch-ready movements` marketing representation.

The historical 20-versus-567 discrepancy came from an earlier limited launch catalog and stale external retrievals rather than two active production data sources. Current raw HTML, sitemap, application queries, and the production database consistently use the expanded library. External caches can update through normal canonical recrawling; no unsafe blanket purge was required.

## Preserved product proof

The rendering correction does not alter the homepage headline, orange identity, training/nutrition/progress sections, adaptive-life scenarios, product UI demonstrations, assessment, pricing, analytics, or navigation.
