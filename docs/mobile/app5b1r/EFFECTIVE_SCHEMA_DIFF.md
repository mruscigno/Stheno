# Effective schema diff

Production currently has `workout_execution_sessions`, `workout_set_logs`, `workout_session_adaptations`, `personal_records`, `exercise_performance_metrics`, `muscle_workload_weekly`, and `training_achievements` with live rows. Production does not have the App 5A revision/tombstone columns, operation receipts, operation outbox, App 5B-1 adapters/private mutation functions, or App 5B-1R lease protocol.

Dependency order is:

`existing workout schema` → `20261020180318 App 5A aggregate transaction` → `20261020192810 App 5B-1 private/public RPC separation` → `20261021154945 App 5B-1R durable delivery state` → `Vercel worker activation`.

No historical table, user row, RLS policy, photo, subscription, or workout record is dropped or rewritten.
