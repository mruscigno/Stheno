# Risks and Blockers

| Priority | Risk | Evidence | Required mitigation / exit |
|---|---|---|---|
| P0 | Native cannot reliably authenticate current APIs | Server client and routes depend on web cookies | Bearer-token mobile API passes auth/RLS integration tests |
| P0 | Anonymous assessment can be lost or claimed incorrectly | Public flow uses localStorage and full-payload claim | Server session, opaque token, revision, expiry, transaction and receipt |
| P0 | Offline replay corrupts workouts/progress | Idempotency exists but no complete sync/conflict protocol | SQLite outbox, receipts, revisions, tombstones and destructive testing |
| P0 | Exercise media rights do not expressly cover native/offline distribution | Available license notice names web/SaaS; manifest covers 61 while 298 assets exist | Written rights plus asset-by-asset provenance reconciliation |
| P0 | Store billing/access divergence | Stripe-only events currently drive subscription state | Provider-neutral ledger and Apple/Google sandbox lifecycle matrix |
| P1 | Six-sprint scope hides multiple high-risk systems | Assessment, billing, offline, media and launch are coupled | Use roadmap subphases and release gates |
| P1 | Direct database reuse leaks schema/invariants into mobile | Current web can call Supabase directly in places | Stable contracts and command services; limited approved direct reads |
| P1 | Sensitive fitness/photo data leaks through device or telemetry | Native caches, notifications, crash SDKs add surfaces | Classification, encryption/redaction, generic pushes, consent, deletion drill |
| P1 | Deep-link verification/reset fails across install states | Native links are not configured | Universal/App Links plus custom fallback and full link test matrix |
| P1 | Program logic drifts between web and mobile | Many pure modules are embedded in current app | Extract once, fixture parity, server-authoritative final results |
| P1 | App review rejection | Fitness, billing, deletion, health disclosures intersect policy | Revalidate policies, complete declarations, reviewer notes/test account |
| P2 | Push reminders arrive at unsafe/wrong times | Device/timezone/preference model absent | Consent, timezone-aware scheduler, revocation and generic content |
| P2 | Bundle/performance growth | Catalog/media and SDKs are large | Stream media, lazy routes, budgets, profiling and no bulk video bundling |
| P2 | Cross-account data persists after logout | Offline DB/outbox is account-scoped | Encrypt/scope/cache purge and account-switch tests |

## Blocking decisions

Engineering may begin App 1 while founder/store accounts and legal review progress. App 2 public testing is blocked on privacy/anonymous-photo decisions. App 2B release is blocked on billing strategy and products. App 4B provider video release is blocked on written native rights. External beta is blocked on disclosures, deletion, support, and security review.

## Contingencies

- If media rights are delayed, ship instructions/anatomy with no provider video; do not substitute unlicensed media or block the catalog.
- If native purchase is delayed, a consumption-only beta may be possible, subject to store policy and clear product approval.
- If anonymous photos are not approved, keep photos post-account while preserving the rest of the pre-signup assessment.
- If offline conflict integrity misses the gate, limit beta workouts to online use and label it; do not imply offline reliability.
