# STHENO Mobile App 0 — Executive Summary

## Verdict

**GO WITH CHANGES.** React Native, Expo, and TypeScript are a strong fit, and the current product contains substantial reusable domain logic. Mobile development should not begin as a screen-by-screen port, however. The first release must establish a native-compatible API/auth boundary, anonymous assessment ownership, an offline workout sync protocol, provider-neutral entitlements, and confirmed native media rights.

This App 0 delivery is architecture and readiness work only. It makes no production behavior changes and does not scaffold a mobile application.

## What is ready

- The canonical 330-exercise catalog and deterministic training, nutrition, progression, assessment, calendar, and review modules are credible foundations for shared TypeScript packages.
- Supabase already provides authenticated user ownership, row-level security, private progress-photo storage, and account deletion/export flows.
- Workout records already include client session keys, timestamps, and idempotency constraints that can be extended into offline synchronization.
- Stripe subscriptions are translated into application entitlements; that separation is the right starting point for Apple and Google purchases.
- STHENO already has the major member workflows: assessment, Blueprint, program, workouts, nutrition, Coach, weekly check-ins, progress, monthly review, photos, account, and billing.

## What must change before feature delivery

1. **Native API authentication:** current route handlers authenticate from web cookies. Add a versioned mobile API that validates Supabase bearer tokens and never ships privileged keys to the device.
2. **Anonymous assessment continuity:** the public assessment is stored in browser local storage and is only persisted after signup. Add server-backed anonymous sessions, secure claim tokens, expiry, and an exactly-once account-linking transaction.
3. **Offline workout correctness:** existing idempotency is useful but is not a sync protocol. Add a SQLite outbox, operation receipts, revisions, conflict rules, tombstones, and visible sync state.
4. **Store billing:** normalize Stripe, Apple, and Google receipts into one entitlement ledger. Do not equate a provider subscription row with access.
5. **Media rights:** the available Vital Animations notice expressly covers websites and SaaS, but does not expressly grant native application distribution, bundling, or offline caching. Obtain written rights and reconcile the 298 hosted assets against the 61-item provenance manifest before mobile distribution.

## Recommended V1 product

Use native tabs for **Today, Plan, Workout, Progress, and Coach**. Surface Nutrition prominently from Today and Plan. Put Exercise Library and Account under profile/More. Preserve the full assessment branching, Blueprint, program generation, workout logging, nutrition, progress, and coaching loop. Keep marketing pages, editorial tools, SEO content, social studio, and administration on the web.

## Delivery shape

Keep the six-release concept, but add explicit gates and split the highest-risk releases into subphases. App 1 must be foundation work, not visible UI. Billing should be isolated from assessment/account linking. Workout/offline and exercise media should be separate gates. Push infrastructure should start before the final launch sprint.

The hardest native feature is not navigation or visual parity. It is an offline workout session that can be edited, completed, retried, adapted, and reconciled without losing user-entered data or corrupting derived progress.

## Founder decisions required

- Confirm legal entity, app name, bundle identifiers, storefront countries, prices, trials, and billing strategy.
- Enroll in Apple Developer and Google Play Console, including tax/banking and reduced-fee programs where eligible.
- Obtain written native streaming, bundling, caching, poster extraction, and offline rights for provider exercise media.
- Approve privacy disclosures, health declarations, deletion SLA, support URL, content rating, analytics consent, and photo retention.
- Provide signing and push-notification credentials when engineering reaches the relevant release gate.

See [GO-NO-GO.md](./GO-NO-GO.md) for the formal gate and [FINAL-SPRINT-ROADMAP.md](./FINAL-SPRINT-ROADMAP.md) for the delivery sequence.
