# Open Issues

| Priority | Issue | Owner / target | Exit condition |
|---|---|---|---|
| P0 | Anonymous assessment/resume/claim lacks secure server session | App 3 backend | Hashed scoped token, expiry/revision, transactional exactly-once claim |
| P0 | Receipt and multi-table mutation effects are not one DB transaction | App 5 platform | Reservation/finalization RPC/service and concurrency tests |
| P0 | Native provider-video rights remain unconfirmed | Founder/legal before media sprint | Written native streaming/bundling/caching terms |
| P1 | Coach/public API rate limiting is not centralized | Platform before external beta | Deployed per-user/session rate limits and abuse tests |
| P1 | Live cross-user/RLS suite needs seeded test identities | QA/platform | Automated non-production integration suite passes |
| P1 | v1 substitution/adaptation/monthly intake/nutrition writes not implemented | App 2–5 sequencing | OpenAPI endpoints and parity tests |
| P1 | Provider-neutral Apple/Google entitlement interface remains design-only | Billing workstream | Store receipt/notification/reconciliation implementation |
| P2 | Supabase legacy key migration may be needed by end of 2026 | Platform | Publishable/secret key rotation plan completed |
| P2 | Existing lint and Sentry/Vite warnings remain | Maintenance | Warnings resolved without behavior change |

No issue above is concealed as completed. App 2 may begin with the authenticated read-only vertical slice while P0 feature dependencies remain gated.
