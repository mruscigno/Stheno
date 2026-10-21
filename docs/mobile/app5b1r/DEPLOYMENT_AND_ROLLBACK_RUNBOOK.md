# Deployment and rollback runbook

Preflight: confirm backup/recovery availability, migration hashes, isolated CI, production schema probes, Vercel `CRON_SECRET` and Supabase secret presence, and zero unexplained drift in touched objects.

Release sequence:

1. Apply the three reviewed migrations in dependency order.
2. Verify schema, grants and queue state without writing customer fixtures.
3. Deploy the tested commit to Vercel production.
4. Invoke the protected worker once and check pending/retry/dead-letter metrics.
5. Exercise one real owner-scoped workout operation only through normal application behavior.

Rollback: disable cron/manual worker invocation and revert application code. Do not drop the additive tables or queued events. Preserve operation receipts and completed outbox rows. Forward-fix applied schema; never reset production or rewrite migration history.

## 2026-10-21 production record

- Source commit: `5617daa0adf761a515d332792f452743fc0b8549`
- Deployment: `dpl_2oZgrnxpQDqGC4HMt83ixUJ5kRBJ`
- Status: READY and promoted
- Smoke: homepage 200; protected workout and worker routes reject unauthenticated POSTs with 401; no runtime errors or 5xx requests in the release window
- Queue safety: no synthetic production fixture was created. The scheduled worker will drain real events through the existing daily cron.
