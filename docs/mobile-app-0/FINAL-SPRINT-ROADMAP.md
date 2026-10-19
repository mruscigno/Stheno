# Final Mobile Delivery Roadmap

The package's six-sprint direction is sound, but several proposed sprints combine unrelated high-risk systems. Retain six release milestones with explicit subphases and gates rather than treating them as fixed-duration feature sprints.

## App 1 — Foundation and contracts

- Add workspace packages and `apps/mobile` only after contract package builds.
- Establish Expo development builds, CI, environments, signing placeholders, design tokens, crash reporting, and test harness.
- Deliver bearer-auth `/api/mobile/v1/bootstrap` and typed client.
- Define anonymous assessment, entitlement, workout-sync, device, and notification schemas/contracts.
- Add characterization/parity fixtures before extracting domain logic.

**Gate:** development build authenticates, refreshes, calls protected API without cookies, and passes secret/RLS/contract tests. No public release.

## App 2A — Assessment, Blueprint, and account linking

- Native full assessment with exact branching, safety, local/server autosave, resume, Blueprint, deep links, signup/sign-in, verification, and transactional claim.
- Optional anonymous photo path only after privacy approval.
- Record legal acceptance and canonical analytics identity.

**Gate:** interruption/retry/two-device tests show no lost or duplicated assessment/program.

## App 2B — Store entitlement foundation

- Provider-neutral ledger, product mapping, receipt verification, notifications, restore/manage subscription, and access UI.
- Decide consumption-only vs native purchase launch by storefront.

**Gate:** sandbox lifecycle matrix produces consistent effective access. Keep this isolated from assessment delivery.

## App 3 — Member core

- Today, Plan/calendar, Nutrition plan/log, Coach, Account, trial/access states, export/deletion.
- Typed read models and explicit command APIs; initial push/device-token infrastructure.

**Gate:** parity matrix items for member core pass API, accessibility, and device tests.

## App 4A — Offline workout

- Session snapshot, SQLite logger, timer restoration, sets/edits/skips/swaps/shorten, outbox, receipts, conflicts, completion and history.

**Gate:** destructive network/replay/multi-device suite shows zero lost or duplicated sets.

## App 4B — Exercise library and media

- Native search/filter/detail, anatomy/alternatives, contextual workout links, media streaming and caching policy.
- Proceed with provider media only after written rights and full provenance reconciliation.

**Gate:** catalog completeness, accessibility, performance, and license evidence approved.

## App 5 — Progress and adaptive loop

- Weekly check-in, charts, monthly reviews, photos, Fitness Memory, recommendations, Coach action acceptance, notifications.
- Validate program/nutrition changes remain server-authoritative and auditable.

**Gate:** complete workout → check-in → review → accepted adaptation scenario passes end to end.

## App 6 — Store hardening and launch

- Privacy/Data Safety/health declarations, screenshots/listings, support/deletion documentation, performance, security review, beta feedback, staged rollout, monitoring and rollback.
- Push reminders and lifecycle messaging are completed here but their infrastructure began in App 3.

**Gate:** store review checklist, billing matrix, deletion drill, crash-free/session and sync-integrity targets, support readiness, and founder sign-off.

## Sequence critique

- Do not lead with UI. API/auth and anonymous ownership are prerequisites.
- Do not hide billing inside account creation; it deserves a separate compliance gate.
- Do not combine offline workout correctness with 330-exercise media work.
- Do not postpone notifications until launch; token/consent architecture affects earlier data models.
- Do not require marketing-site parity. V1 parity means member capability and funnel continuity.

This is effectively eight engineering workstreams delivered through six release milestones. Calendar estimates should be created only after App 1 spikes close the bearer auth, anonymous claim, offline sync, and media-license uncertainties.
