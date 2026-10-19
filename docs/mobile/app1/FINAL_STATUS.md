# App 1 Final Status

## Verdict

**READY WITH BLOCKERS**

The shared platform/API foundation is implemented and the additive production migration is verified. Existing web behavior, billing, Coach safety tests, the 28-day scheduler, the 330 canonical exercise identities, and purchased media are preserved. The remaining blockers are explicitly outside the safe App 1 scope: secure anonymous assessment claims, truly atomic receipt-plus-domain mutations, and seeded cross-user integration testing.

## Release facts

| Item | Value |
|---|---|
| Baseline commit | `32843945e4564a5fb3dda18841841260674cb298` |
| Release commit | Pending final commit |
| Supabase migration | Applied and verified on 2026-10-19 |
| Production deployment | Pending final quality gates |
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

Pending final verification and production release. This section will be replaced with exact command results, commit, deployment ID, status, and smoke checks before handoff.
