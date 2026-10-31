# Deployment and rollback

Deployment order:

1. Confirm final CI and invariant checks.
2. Apply only `20261031184807_app5b2v_native_workout_rollout.sql`; do not run blanket `db push` or repair historical ledger entries.
3. Deploy the application with rollout state still `DISABLED`.
4. Verify health, unauthenticated 401s, rollout row, zero cohort rows and worker logs.

Application rollback may return to the previous Vercel deployment. Database rollback is forward-only: keep the additive rollout tables and entitlement uniqueness index; set `native_workout` to `DISABLED`. Never drop receipts, outbox rows or cohort history during an incident. Removing a client flag is not a security rollback.
