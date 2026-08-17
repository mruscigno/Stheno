# STHENO Fitness

Products 1–3 establish the secure platform, versioned assessment/personalization system, and deterministic training intelligence for STHENO—an evidence-led digital personal trainer, not a generic workout generator.

## Local setup

1. Copy `.env.example` to `.env.local` and provide development values.
2. Run `pnpm install`.
3. Run `pnpm dev`.

Use `pnpm verify` for lint, type checking, unit tests, and a production build. Database changes live in `supabase/migrations`; RLS tests live in `supabase/tests`.

## Product 2

Authenticated members complete a mobile-first, resumable assessment at `/app/assessment`. Raw answers, free-form context, safety results, interpreted candidates, and versioned personalization snapshots are stored separately with owner-scoped RLS. Product 3 consumes profile contract `1.0.0`, not the raw questionnaire.

The bounded context interpreter proposes confirmable context after deterministic safety screening. This sprint does not generate workouts or prescribe calories/macros.

## Product boundaries

Product 3 adds methodology/ruleset versioning, a reviewed V1 exercise knowledge library, deterministic program generation and validation, substitution scopes, time/equipment workout reconstruction, schedule adaptation, progression, explainability, and immutable Product 4 handoff records. Final workout execution remains Product 4.

Included: auth/account lifecycle, domain schema and RLS, deterministic engine and AI boundaries, subscription/entitlement skeleton, analytics/observability/email configuration foundations, branded responsive shells, CI, and documentation.

Deferred: personalized assessment, blueprint, program generation, workout execution, progression behavior, nutrition calculation, weekly check-in, AI Coach UX, progress dashboard, final conversion landing page, calculators, referrals, and native apps.
