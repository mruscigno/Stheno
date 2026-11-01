# Production migration preflight

## Read-only findings

- Supabase CLI `2.122.0` connected to the linked production project and listed the migration ledger.
- The ledger remains extensively divergent: many remote-only and local-only versions exist.
- The App 6D-2 migration `20261101143058_app6d2_media_catalog.sql` is local-only and is not applied to production.
- Supabase MCP schema/table/advisor access returned permission denied.
- A read-only production schema dump could not run because the CLI requires Docker/Podman for `pg_dump`, neither of which is installed.

## Additive dependency graph

`exercises` → `exercise_media_assets` → `exercise_media_derivatives` → `exercise_media_links` → `exercise_media_review_events`.

All foreign-key deletes are restrictive except exercise-link/review-event cleanup. New rows default pending/inactive. Explicit Data API grants are present for read-only derivative/link metadata; provenance and review-event tables are revoked. RLS is enabled on all four tables. This explicitly accounts for Supabase's October 30, 2026 Data API grant change.

## Lock and rollback posture

The migration creates four new tables, constraints, indexes, grants, and policies. It does not rewrite an existing high-volume table or delete data. If application fails before commit, PostgreSQL transaction rollback is expected. After commit, rollback should disable the feature and links first; table removal is not required and should not be used as an emergency response.

## Gate

Do not run `db push`, repair unrelated history, or apply the migration to production. First execute the migration and `supabase/tests/app6d2_media_catalog_security.sql` against an isolated real PostgreSQL/Supabase environment, then compare the actual production schema through an authorized read-only connection. A separately reviewed, individually applied SQL change requires explicit production authorization.
