# Production compatibility matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| Workout revision, receipt and durable outbox schema | PASS | Live catalog query shows RLS-enabled session/set/receipt/outbox tables and required RPCs. |
| Public mutation authorization | PASS | Harmless live probes: health `200`, unauthenticated session mutation `401`, unauthenticated worker `401`. |
| Rollout control/cohort schema | PENDING DEPLOYMENT | `20261031184807_app5b2v_native_workout_rollout.sql`; default-off and additive. |
| Web logger compatibility | PASS | Existing `/api/workouts/today` is unchanged; new gate applies only to native v1 mutations. |
| Entitlement schema compatibility | FIXED IN CODE | Live columns are `entitlement_key`, `active`, `ends_at`, `source_subscription_id`; webhook/refund previously used nonexistent names. |
| Outbox backlog | PASS AT AUDIT | Live outbox contained zero rows, zero dead letters and zero ready pending events. |
| Outbox prompt recovery | FIXED IN CODE | Existing daily path was up to 24 hours; dedicated protected cron is now scheduled every ten minutes. |
| Migration ledger | NOT VERIFIED / DRIFT | Live semantic objects exist while queried App 5A/5B ledger versions are absent. No push or ledger repair is permitted. |
| Native Progress | PASS | `EXPO_PUBLIC_PROGRESS_V1_ENABLED` remains default `false`. |
| AI form analysis | PASS | No App 6B activation changed in this sprint. |

Production uses PostgreSQL 17.6.1.155. The linked database has no `pg_cron`; recovery scheduling is therefore Vercel-based.
