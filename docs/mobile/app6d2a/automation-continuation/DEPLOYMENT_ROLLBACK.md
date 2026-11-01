# Deployment and rollback

## Current status

No production database, storage, Vercel deployment or native activation was performed.

## Safe activation sequence

1. Reconcile the real production schema and migration ledger without marking unknown history applied.
2. Apply only the reviewed additive SQL through an authorized process and rerun pgTAP/RLS tests.
3. Upload the 103 manifest rows idempotently and verify checksums/CDN headers.
4. Insert links inactive, validate web and current-source Android playback, then enable a narrow flag cohort.
5. Expand only after monitoring confirms fallback and playback behavior.

## Rollback

Disable `STHENO_MEDIA_6D2_ENABLED` or set the affected links inactive. The resolver immediately returns the preserved Vital fallback. Do not delete exercise rows, workout history, legacy media or subscriptions.
