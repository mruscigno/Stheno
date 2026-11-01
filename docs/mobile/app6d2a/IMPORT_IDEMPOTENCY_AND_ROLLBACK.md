# Import idempotency and rollback

The generated import plan contains 103 inactive links and uses `asset-id + canonical-slug + media-role + version` as the deterministic idempotency key. Applying the plan twice in memory produces 103 records both times. Plan SHA-256: `e1a916d0cce9485267b09616aae2c8309286c7a75f4e57ec66bc0f58a0cc21f5`.

Interruption recovery is file/hash based: completed source extraction, contact sheets, derivative hashes, review decisions, and storage keys are deterministic. A rerun replaces the same private derivative path and produces the same logical storage key.

Rollback is per exercise: set the new link inactive or disable `STHENO_MEDIA_6D2_ENABLED`. The resolver immediately returns the preserved Vital fallback. No legacy media, workout history, exercise row, or subscription data is deleted.

Database replay and RLS tests are prepared in `supabase/tests/app6d2_media_catalog_security.sql` but remain unexecuted because an isolated PostgreSQL/Supabase runtime was not available.
