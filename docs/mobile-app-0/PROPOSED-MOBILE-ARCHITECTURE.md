# Proposed Mobile Architecture

## Technology choice

Use React Native with Expo and TypeScript. Expo provides an appropriate managed foundation for builds, updates, deep links, notifications, SecureStore, SQLite, camera/photo access, and store delivery while preserving the option to add native modules through development builds.

## Repository structure

Adopt an incremental workspace:

```text
/
  src/                         # existing Next.js web app, initially unchanged
  apps/mobile/                 # Expo Router application
  packages/domain/
  packages/contracts/
  packages/validation/
  packages/api-client/
  packages/design-tokens/
```

Do not move the existing web app into `apps/web` during App 1. That can be a later mechanical migration after native contracts are stable.

## Client layers

- **Navigation:** Expo Router with authenticated and public route groups.
- **Server state:** TanStack Query for normalized fetch/mutation cache and revalidation.
- **Ephemeral state:** Zustand or feature reducers for active workout UI, timers, and transient choices.
- **Durable local data:** `expo-sqlite` for anonymous assessment drafts, workout snapshots, operation outbox, and read-through cache.
- **Secrets:** `expo-secure-store` for refresh/access tokens and local encryption keys only.
- **Networking:** typed `@stheno/api-client` with bearer auth, idempotency keys, contract versions, timeouts, cancellation, and structured error codes.
- **Telemetry:** named product events with one stable anonymous installation identity that is aliased to the account identity after signup; no health/answer/photo data.

## Navigation

Authenticated tabs:

1. **Today** — next workout/check-in/review, nutrition summary, sync state.
2. **Plan** — current program, schedule, blocks, nutrition plan, adaptations.
3. **Workout** — session start/resume and offline logger.
4. **Progress** — trends, weekly/monthly reviews, photos, recommendations.
5. **Coach** — conversations and explicit action proposals.

Nutrition is a first-class card and stack from Today and Plan instead of a sixth tab. Exercise Library and Account appear under the profile/More entry and through contextual links.

## Public flow

Launch directly into the first real assessment question. Allow anonymous autosave and resume. Generate and show the Blueprint before requiring an account. Account creation then transactionally claims the assessment and produces the member program/trial. Do not insert a marketing screen or signup wall before the assessment.

## Online/offline boundaries

The app is online-first except workout execution and assessment drafting. Catalog, plan, nutrition, progress, and Coach may cache last-known reads, but mutations outside the workout should require connectivity unless a specific queued-command design exists. The workout logger uses a local snapshot and outbox so set logging, edits, skips, timers, substitutions, and completion remain usable offline.

## Server authority

The server owns authentication, access, billing, program creation, adaptation, Coach execution, progress derivation, photo signing, notifications, and conflict resolution. The client owns immediate interaction state and queued user intent. On reconnect, the client submits operations; it does not overwrite whole server documents.

## V1 exclusions

- Marketing homepage, pricing comparison content, methodology, FAQ, and contact experience.
- Articles/insights authoring and SEO pages; open relevant content in the web browser.
- Public calculators beyond links needed by the member flow.
- Admin, editorial, social-share studio, content ingestion, and exercise production tools.
- Offline Coach, offline program generation, or downloaded exercise-video packs.

## Quality gates

- Accessibility: dynamic type, screen-reader labels/order, 44-point targets, reduced motion, color contrast.
- Device matrix: current and previous iOS, representative midrange Android, slow network, offline, background/restore.
- Contract tests: every command/response against server schemas.
- Release controls: internal distribution, crash-free and sync-integrity thresholds, staged rollout, rollback-ready updates.
