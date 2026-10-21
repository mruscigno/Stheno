# pgTAP, concurrency and failure results

The isolated workflow runs:

```text
supabase test db supabase/tests/app5a_workout_atomicity.sql
supabase test db supabase/tests/app5b1_protocol_integration.sql
supabase test db supabase/tests/app5b1r_durable_outbox.sql
bash scripts/app5a/run-concurrent-workout-operations.sh
bash scripts/app5b1r/run-concurrent-outbox-claims.sh
supabase db lint --level warning
```

App 5B-1R adds 25 assertions covering worker permissions, claims, per-session ordering, lease recovery, retry, dead-lettering, effect receipts and re-drive. The real shell race requires exactly one of two concurrent workers to claim the event.

[GitHub Actions run 39631869853](https://github.com/mruscigno/Stheno/actions/runs/39631869853) passed all 57 pgTAP assertions, both real concurrent races, database lint, web contract tests and the production build.
