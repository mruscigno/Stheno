# Isolated database and RLS tests

The additive migration was executed in a disposable PGlite PostgreSQL environment with Supabase-equivalent `anon` and `authenticated` roles. **22/22 checks passed.**

Verified: four tables exist; RLS is enabled on every exposed table; provenance/review tables are not client-readable; reviewed derivative/link tables have select-only client grants; inactive links are hidden; only approved derivatives and fully reviewed active links are visible; client writes are denied; duplicate derivative replay is blocked; and transactional rollback restores a deleted link.

This is a real isolated PostgreSQL execution, not a production claim. The production migration ledger remains divergent, so no `db push`, history repair, or production SQL was attempted.
