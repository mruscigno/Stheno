# Architecture Decisions

## ADR-1: Incremental platform folders, no monorepo move

Added `src/platform/{contracts,client,server}`. A repository-wide move would add risk without improving App 1. Future Expo work can extract these boundaries into workspace packages after parity fixtures stabilize.

## ADR-2: Bearer tokens and cookies share one auth function

`authenticateRequest` validates bearer tokens with Supabase `auth.getUser(token)` and builds an RLS-aware client carrying that token. When no bearer header exists it falls back to the established SSR cookie client. User IDs always come from verified authentication, never request bodies.

## ADR-3: Version response envelopes, not database schemas

`/api/v1` returns `apiVersion`, `requestId`, and either `data` or a structured error. Database row shapes are composed into read models; the database schema is not declared the mobile contract.

## ADR-4: Server-authoritative orchestration

Program, nutrition, workout intelligence, progress, Coach, access, and monthly decisions remain server-owned. The mobile-safe client contains transport only.

## ADR-5: Durable mutation receipts plus existing domain constraints

Stable operation UUIDs and payload hashes detect exact replays and altered-payload reuse. Existing session/set unique constraints provide domain-level dedupe. Full transactional reservation across every derived workout effect remains an identified hardening item before offline App 5.

## ADR-6: Defer anonymous session infrastructure

App 1 does not create an insecure bearer-like token over the current localStorage payload. App 3 must implement hashed opaque tokens, expiry, revisions, private staged uploads, and transactional exactly-once claim.

## ADR-7: Stripe remains unchanged

No Apple/Google billing code or entitlement bypass was added. `/api/v1/me` reports the current effective web access and entitlement records.
