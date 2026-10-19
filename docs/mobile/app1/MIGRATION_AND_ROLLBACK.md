# Migration and Rollback

## Migration

`20261019173220_mobile_app1_api_idempotency.sql` is additive. It creates one owner-scoped receipt table, expiry index, RLS policies, grants, and documentation comment. It does not alter existing rows, foreign keys, billing, exercises, media, programs, workouts, or reviews.

Apply the database migration before promoting code because mutation endpoints reference the new table. Verify table/RLS/policies, insert/select as an authenticated test user, reject cross-user access, then run security and performance advisors.

## Application rollout

1. Apply migration.
2. Deploy preview and run public exercises plus unauthenticated/invalid-token smoke tests.
3. Use non-production test accounts to exercise owner reads, trial expiry, replay, altered-payload conflict, and cross-user IDs.
4. Promote after gates pass.

## Rollback

Roll back the Vercel deployment first. The additive receipt table can remain safely because legacy code does not reference it. If removal is required after confirming no supported deployment uses it:

```sql
drop table if exists public.api_idempotency_records;
```

Dropping the table discards replay receipts, so it must never precede application rollback. No exercise or member migration needs reversal.
