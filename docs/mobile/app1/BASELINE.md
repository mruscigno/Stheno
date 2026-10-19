# Baseline

- Captured: 2026-10-19
- Branch: `product-13-assessment-contact-us-units-content-depth`
- Baseline commit: `32843945e4564a5fb3dda18841841260674cb298`
- Workspace state: only pre-existing untracked `artifacts/`
- Framework: Next.js 16.3.1 / React 19.2.8 / TypeScript 5 / Supabase JS 2.112.3
- Architecture: one Next.js App Router application; cookie-authenticated route handlers; Supabase Postgres/RLS/storage; server OpenAI; Stripe web billing.

## Baseline commands

| Command | Exit | Result |
|---|---:|---|
| `pnpm lint` | 0 | 8 pre-existing warnings, 0 errors |
| `pnpm typecheck` | 0 | Passed |
| `pnpm test` | 0 | 50 files, 208 tests passed |
| `pnpm build` | 0 | 140 static pages generated; production build passed |

Baseline tests took 127.17 seconds. Baseline build compiled in 21.9 seconds and TypeScript completed in 24.1 seconds. The build emitted the existing Sentry `disableLogger` deprecation warning.

## Baseline integrity

- Canonical exercises: 330 unique slugs.
- Sorted newline-delimited slug SHA-256: `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`.
- Vital manifest entries: 298.
- Purchased media files: 298 MP4 and 298 WebP posters.
- Full identity list: `BASELINE_EXERCISE_IDS.json`.

## Baseline risks

- Existing APIs authenticate through Next/Supabase cookies and are unsuitable for native bearer tokens.
- Existing set/session keys provide partial idempotency but no common API receipt contract.
- Anonymous acquisition state is browser-local and cannot yet support secure server resume/claim.
- Several route handlers combine transport, auth, database orchestration, and domain logic.
