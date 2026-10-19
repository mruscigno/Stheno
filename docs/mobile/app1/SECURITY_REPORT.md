# Security Report

## Implemented controls

- Bearer JWTs are verified by Supabase `auth.getUser(token)`; decoded claims and client owner IDs are never trusted.
- Authenticated data queries carry the member token, so existing RLS remains defense in depth.
- Paid/trial feature endpoints run the same first-party access evaluator as the web and return structured `402 ACCESS_EXPIRED` with an upgrade path.
- Public exercise APIs expose only production-ready, technically/editorially/visually reviewed records.
- Shared contracts/client contain no Next.js, Supabase, environment, service-role, Stripe, or AI secrets.
- IDs and payloads are bounded by Zod; errors do not expose database messages.
- Idempotency rows are owner-scoped with RLS and least-privilege select/insert grants.
- `/api/v1/progress` returns photo metadata, not storage paths or signed URLs.

## Authorization review

All member reads and writes filter by the verified `user.id`. Workout session/set and monthly review identifiers are additionally scoped to that owner. Cross-user requests therefore resolve as not found rather than revealing existence. The migration policies use `TO authenticated` plus `auth.uid() = user_id`, including `WITH CHECK` on insert.

## Preserved controls

Private photo storage, analytics redaction, disabled broad autocapture, Stripe signature verification, trial evaluation, Coach safety classification, and account export/deletion remain unchanged.

## Open security work

- No shared production rate limiter exists; add one before exposing costly Coach or anonymous session creation at mobile scale.
- Anonymous assessment tokens/claim are deferred until hashed scoped credentials, expiry, revision, private upload retention, and a transactional claim can be implemented.
- Mutation receipts and derived writes require a database transaction/reservation design before claiming robust multi-device offline synchronization.
- Live cross-user/RLS integration testing requires seeded non-production accounts; no production customer records were used.
- Run Supabase advisors after applying the migration and remediate new findings attributable to App 1.
