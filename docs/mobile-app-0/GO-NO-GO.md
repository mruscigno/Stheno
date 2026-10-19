# Go / No-Go Decision

## Decision: GO WITH CHANGES

STHENO is ready to begin **App 1 foundation work**. It is not ready to begin a feature-first mobile port or promise a production launch date.

## Why go

- The product, domain model, member workflows, catalog, and deterministic TypeScript logic are substantive and reusable.
- Supabase, private storage, RLS, Stripe-derived entitlements, and existing workout idempotency provide a credible platform base.
- React Native + Expo can meet the required navigation, deep-link, SQLite, push, camera/photo, and store-delivery needs.
- No architectural evidence requires a separate native backend or a rewritten fitness engine.

## Required changes

1. Build and prove native bearer authentication and a versioned API/service boundary.
2. Implement secure server-backed anonymous assessment/resume and transactional claim.
3. Specify and test the offline workout operation/receipt/conflict protocol.
4. Normalize Stripe, Apple, Google, and grants into one effective entitlement model.
5. Obtain written native media rights and reconcile provider provenance before App 4B.
6. Adopt the gated roadmap and V1 scope in this delivery plan.

## Gate decisions

| Gate | Status |
|---|---|
| Start App 1 architecture/foundation | **GO** |
| Build feature UI before API/auth contracts | **NO-GO** |
| External assessment beta | **Conditional** on claim/privacy tests |
| Native purchase release | **Conditional** on store strategy and sandbox lifecycle tests |
| Offline workout claim | **Conditional** on zero-loss destructive testing |
| Provider video distribution in native | **NO-GO** until written rights/provenance |
| Public store launch | **Conditional** on App 6 compliance/security/support gates |

## Re-evaluation evidence

At the end of App 1, present a native development build, bearer-auth API test report, anonymous claim schema/transaction proof, offline sync contract spike, entitlement data model, CI results, and media-rights status. Only then approve App 2 scope and dates.

No production code or behavior was changed by App 0.
