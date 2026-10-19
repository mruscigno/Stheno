# App 1 integration report

Verified on 2026-10-19 before App 2 implementation.

## Repository and release

- Repository HEAD at entry: `108153a`, a descendant of App 1 implementation commit `cb83821b6af89fbf6c2d6cca01b89ce1d48d7bb4`.
- Branch: `product-13-assessment-contact-us-units-content-depth`.
- App 1 final report: `docs/mobile/app1/FINAL_STATUS.md`.
- Implemented OpenAPI inventory: `docs/mobile/app1/openapi.json`.
- Shared contracts: `src/platform/contracts/api.ts`.
- Typed transport: `src/platform/client/api-client.ts`.
- Bearer/cookie authentication: `src/platform/server/auth.ts`.
- Read DTO implementation: `src/platform/server/read-models.ts`.
- Idempotency migration: `supabase/migrations/20261019173220_mobile_app1_api_idempotency.sql`.

## Live contract checks

| Endpoint | Observed result |
|---|---|
| `/api/health` | 200, version `cb83821` |
| `/api/v1/exercises?limit=1` | 200, API version `1.0` |
| `/api/v1/me` without token | 401 `AUTH_REQUIRED` |
| `/api/v1/today` without token | 401 `AUTH_REQUIRED` |
| `/api/v1/program` without token | 401 `AUTH_REQUIRED` |
| `/api/v1/nutrition` without token | 401 `AUTH_REQUIRED` |
| `/api/v1/progress` without token | 401 `AUTH_REQUIRED` |

The native vertical slice may use Supabase access tokens in `Authorization: Bearer <token>` and the existing typed client. No cookie emulation or privileged key is needed.

## Compatibility matrix

| App 2 dependency | Implementation | Disposition |
|---|---|---|
| Versioned envelopes and errors | `src/platform/contracts/api.ts` | Compatible |
| Native-safe fetch transport | `src/platform/client/api-client.ts` | Compatible; App 2 adds concrete read DTO types without changing wire behavior |
| Member bootstrap | `GET /api/v1/me` | Implemented |
| Today read model | `GET /api/v1/today` | Implemented, read-only |
| Program/nutrition/progress reads | `/api/v1/program`, `/nutrition`, `/progress` | Implemented; not promoted as App 2 screens |
| Workout/monthly mutations | App 1 routes | Out of App 2 scope |
| Anonymous assessment session/claim | Not implemented | Hard-deferred to App 3; entry UI must not persist answers |
| Entitlement | `/api/v1/me` access object and server gate | Read-only in App 2 |
| Password auth/reset/verification | Existing Supabase Auth project | Compatible with native PKCE/deep links |

## Security and unresolved gates

- Mobile may contain only the public Supabase URL, publishable key, and public API base URL.
- Service-role, Stripe, OpenAI, Resend, and other privileged credentials remain server-only.
- App 1 reports verified owner-scoped RLS for the idempotency table, but live two-user isolation was not executed.
- App 2 still requires two non-production seeded identities for the mandated profile/workout/progress/monthly-review/photo isolation suite. No real customer or production synthetic account will be used without explicit authorization.
- Anonymous assessment session/resume/claim remains an App 3 blocker and will not be mocked as production success.

## Data invariants at entry

- Canonical exercise IDs: 330.
- Newline-delimited slug SHA-256: `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`.
- Purchased media manifest mappings: 298.
- Purchased MP4 files: 298.
- Purchased poster files: 298.

**Entry gate result: PASS WITH KNOWN SECURITY-TEST FIXTURE BLOCKER.** The implemented bearer endpoints and mobile-safe contracts are sufficient to build the App 2 shell. Full acceptance remains blocked until the two-user tests can run.
