# Domain and Service Map

| Capability | Portable/shared | Server-only | App 1 action |
|---|---|---|---|
| API envelopes/errors/pagination | Yes | No | Added `src/platform/contracts/api.ts` |
| Assessment definitions/branching | Existing pure modules | Persistence/claim | No duplicate; secure anonymous work deferred |
| Blueprint rules | Existing pure module | persistence/email/claim | Documented, no unsafe endpoint added |
| Member access | Trial evaluator | subscription queries | Used by member read model |
| Exercise content | Canonical structures | Supabase query/provenance | Shared service + public v1 APIs |
| Today/program/nutrition/progress | DTO-compatible data | owner-scoped query/orchestration | Server read models + v1 adapters |
| Workout logic | Effective workout/summary | session/set writes, intelligence, PRs | Server service + typed replay APIs |
| Monthly review rules | Deterministic validation | owner writes and recommendation application | Server service + selective decision API |
| Coach classification/safety | Existing pure orchestration | OpenAI, evidence, messages | Bearer-compatible server adapter |
| Billing | Access type can be shared | Stripe/webhooks/secrets | Preserved; provider interface remains future work |

Client-importable code lives under `src/platform/contracts` and `src/platform/client`. It imports no Next.js, Supabase client, database code, environment variables, or privileged credentials. `src/platform/server` owns authentication, authorization, persistence, AI, and derived effects.
