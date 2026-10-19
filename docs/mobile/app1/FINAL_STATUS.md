# App 1 Final Status

## Verdict

**READY WITH BLOCKERS**

The shared platform/API foundation is implemented and the additive production migration is verified. Existing web behavior, billing, Coach safety tests, the 28-day scheduler, the 330 canonical exercise identities, and purchased media are preserved. The remaining blockers are explicitly outside the safe App 1 scope: secure anonymous assessment claims, truly atomic receipt-plus-domain mutations, and seeded cross-user integration testing.

## Release facts

| Item | Value |
|---|---|
| Baseline commit | `32843945e4564a5fb3dda18841841260674cb298` |
| Release commit | `cb83821b6af89fbf6c2d6cca01b89ce1d48d7bb4` |
| Supabase migration | Applied and verified on 2026-10-19 |
| Production deployment | `dpl_9BkC5ASPVnPQt41uuuqZBWSxLVmW` — READY and promoted |
| Production URL | `https://www.sthenofitness.com` |

## Delivered API surface

- Public exercise catalog and detail routes under `/api/v1/exercises`
- Bearer-or-cookie authenticated member, today, program, nutrition, and progress reads
- Replay-aware workout start/resume, set upsert, and completion mutations
- Monthly-review read and decision mutation
- Versioned Coach question adapter using the existing safety implementation
- Typed native-safe API client, Zod contracts, structured error envelopes, request IDs, and cursor pagination

## Preserved invariants

- 330 canonical exercise IDs; checksum `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`
- 298 purchased media mappings, 298 MP4 files, and 298 posters
- Existing cookie-authenticated website behavior
- Existing Stripe entitlement evaluation
- Existing Coach classification/safety path
- Existing 28-day monthly scheduler
- No service-role or privileged key added to shared/client code

## Explicit blockers

1. Secure anonymous assessment/resume/claim remains assigned to App 3. The current local-storage claim model cannot meet scoped, expiring, exactly-once token requirements safely.
2. Receipt persistence and multi-table domain effects are not yet one database transaction. Existing uniqueness constraints make retries substantially safer, but App 5 must add reservation/finalization or a transactional RPC before the platform can claim full offline concurrency correctness.
3. Live cross-user RLS tests require seeded test identities; the migration's owner policies and grants were verified directly, but a two-user production test was not performed.
4. The connected Supabase plugin token lacks permission to run database advisors, so no advisor-clean claim is made.

## Final gate and deployment evidence

- `pnpm lint`: passed with 0 errors and 8 pre-existing warnings.
- `pnpm typecheck`: passed.
- `pnpm test`: 54 files and 217 tests passed.
- `pnpm build`: passed; 140 static pages generated.
- Vercel production-environment build: READY; deployment `dpl_9BkC5ASPVnPQt41uuuqZBWSxLVmW`.
- The exact staged artifact was smoke-tested before promotion.
- Live `/`: 200.
- Live `/api/health`: 200 and version `cb83821`.
- Live `/api/v1/exercises?limit=1`: 200 with API version `1.0`.
- Live `/api/v1/me` without credentials: structured 401 `AUTH_REQUIRED`.
- Vercel runtime error scan after smoke tests: 0 error records in the available 30-minute retention window.

App 2 may begin with the authenticated read-only vertical slice. The P0 items above remain hard gates for the later offline/claim workflows and are not represented as complete.
