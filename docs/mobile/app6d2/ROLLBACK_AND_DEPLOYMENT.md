# Rollback and deployment

No production deployment or media activation occurred.

Rollback order after a future deployment:

1. Set `STHENO_MEDIA_6D2_ENABLED=false`.
2. Clients immediately return to the existing Vital mapping or written guide.
3. Mark affected links inactive; retain provenance and review history.
4. Withdraw derivative delivery objects only after traffic and cache expiry checks.
5. Do not delete canonical exercises, workout history, source provenance, or old mappings.

Production prerequisites are a reviewed migration reconciliation, isolated real-Postgres migration test, secure storage/CDN configuration, asset upload verification, web/Android playback evidence, and a guarded flag rollout. A deployment must never include a blind migration-history repair.
