# Deployment and rollback runbook

Preflight: confirm backup/recovery availability, migration hashes, isolated CI, production schema probes, Vercel `CRON_SECRET` and Supabase secret presence, and zero unexplained drift in touched objects.

Release sequence:

1. Apply the three reviewed migrations in dependency order.
2. Verify schema, grants and queue state without writing customer fixtures.
3. Deploy the tested commit to Vercel production.
4. Invoke the protected worker once and check pending/retry/dead-letter metrics.
5. Exercise one real owner-scoped workout operation only through normal application behavior.

Rollback: disable cron/manual worker invocation and revert application code. Do not drop the additive tables or queued events. Preserve operation receipts and completed outbox rows. Forward-fix applied schema; never reset production or rewrite migration history.
