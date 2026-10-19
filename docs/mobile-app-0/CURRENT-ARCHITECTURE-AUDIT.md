# Current Architecture Audit

## System shape

STHENO is a single Next.js 16 TypeScript application deployed on Vercel. It is not currently a monorepo and has no native application package. The web app combines public marketing/content, authenticated member UI, route-handler APIs, deterministic fitness logic, and Supabase persistence.

| Area | Current implementation | Mobile consequence |
|---|---|---|
| Web/UI | Next.js App Router under `src/app`; React components under `src/components` | UI is not reusable directly; behavior and tokens can be extracted |
| Auth | Supabase SSR browser/server clients; server reads cookies in `src/lib/supabase/server.ts` | Native bearer tokens are not accepted by most APIs |
| Route protection | `src/proxy.ts` enforces authentication and trial access | Native must not depend on redirects or web cookies |
| Database | Supabase Postgres migrations under `supabase/migrations` with RLS | Strong base; mobile commands need stable server contracts |
| Storage | Private progress-photo bucket with owner-prefixed objects and signed URLs | Suitable after upload/resume/EXIF/retention design |
| Billing | Stripe checkout, portal, webhook, subscriptions and entitlements | Must add Apple/Google reconciliation without replacing Stripe web billing |
| Analytics | HeyCatch/PostHog plus server forwarding; sensitive property filtering | Native SDK plan and stable identity contract required |
| Operations | Vercel cron for activity reminders | Push and background delivery need a provider/device-token system |

## Assessment and Blueprint

The public acquisition assessment in `src/components/acquisition/free-assessment.tsx` stores anonymous progress in browser `localStorage`. `src/app/api/blueprint/route.ts` produces a deterministic Blueprint without persisting anonymous ownership. After authentication, `src/app/api/assessment/claim/route.ts` accepts the complete v4 answer payload, maps it into account-owned records, and generates a program.

The authenticated assessment route persists starts, saves, and completion, and the underlying definition preserves branching and safety behavior. The gap is the anonymous-to-account boundary: there is no server anonymous session, opaque claim credential, revision, expiry, claim receipt, or transactional exactly-once transfer. Anonymous progress photos are also unsupported because photo upload requires an authenticated owner.

## Authentication and account lifecycle

The site supports email/password, magic link, verification callback, password reset, logout, legal acceptance, data export, and deletion. Native deep links and app/universal links are not configured. Account deletion can invoke Supabase admin deletion when server credentials are available or create a pending request otherwise.

The design can satisfy store account-deletion rules, but the mobile API must accept bearer authentication and display subscription cancellation guidance before deletion. SecureStore should contain tokens only; no service-role or Stripe secret may enter the app bundle.

## Domain logic

The strongest reuse candidates live under `src/modules`: assessment definition/profile/safety, training generation and selection, prescriptions, progression, nutrition engines, workout calculations, calendars, adaptive coaching, and monthly review. Many are deterministic TypeScript. Route handlers and `server.ts` modules mix authorization, persistence, service calls, and orchestration and should remain server-side.

Program generation and Coach actions should remain server-authoritative even if they use shared pure packages. This avoids logic drift, manipulation, and duplicated migrations. Mobile may share contracts, validation, presentation calculations, units, and carefully selected deterministic functions.

## Workout execution

The schema already has useful idempotency primitives:

- `workout_execution_sessions` uniquely identifies a user's client session key.
- `workout_set_logs` uniquely constrains user/idempotency key and session/exercise/set ordinal.
- APIs accept client timestamps and stale sessions are handled after 18 hours.

These are not yet an offline protocol. There is no durable device outbox, per-operation receipt, monotonic client revision, server conflict response, tombstone model, or surfaced pending/failed state. Current update/insert behavior is adequate for an online web session but cannot guarantee deterministic replay from an intermittently connected phone.

## Exercise and media system

`content/exercises/canonical-exercises.json` contains 330 exercises. The public asset directories contain 298 Vital videos/posters, while `content/exercises/provider-media-manifest.json` marks 61 records ready. The available 2026.1 license notice covers commercial websites, SaaS, self-hosting, transcoding, renaming, and still extraction and restricts standalone asset-library distribution.

The notice does not explicitly grant native-app distribution, application bundling, offline downloads/caching, or store redistribution. No provider media should be bundled or made offline-capable until rights are confirmed in writing and the provenance mismatch is resolved.

## Progress, nutrition, and Coach

The web product supports nutrition targets and daily tracking, supplements/sample days, weekly check-ins, progress charts, private photos, monthly reviews and recommendations, Fitness Memory, and recommendation acceptance. Coach combines database context, deterministic routing/safety/action proposals, and server-side OpenAI use. Coach must stay behind the server API; prompts, secrets, and privileged context must never run on-device.

## Data security and observability

RLS is owner-based for member data and public catalog data is read-only. Progress photos are private, type/size constrained, and delivered through short-lived signed URLs. Analytics utilities drop sensitive-looking keys and long strings; PostHog autocapture is disabled and Sentry is configured without PII. Mobile must reproduce these controls, avoid assessment/health payloads in telemetry, and add a native consent and device-identity lifecycle.

## Conclusion

The product is reusable at the domain and data layers, but the current HTTP boundary is web-specific. Native development is feasible after App 1 establishes bearer-token APIs, shared contracts, anonymous claim architecture, entitlement interfaces, and offline sync contracts.
