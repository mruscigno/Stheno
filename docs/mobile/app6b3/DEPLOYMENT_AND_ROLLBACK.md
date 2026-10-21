# Deployment and rollback

The temporary Vercel runtime probe deployment `dpl_B2ofabcyAzWo3s7gB128rw8i5TQH` and its preview-only secret were deleted after evidence capture.

Production release:

- inert application deployment `dpl_HgZF6gHdUQyQ63cxYTHjoEACcEnd` was promoted after smoke testing;
- homepage returned 200, unauthenticated upload intent returned 401, and the cron worker returned 401 without its credential;
- post-release runtime error query returned zero records;
- all form-review flags were confirmed absent/off;
- `20261021204105_app6b3_retention_cleanup_hardening.sql` must not be applied to production in this sprint;
- no private-pilot user IDs may be configured;
- no processing or public flags may be enabled.

Rollback for inert web code: promote the prior production deployment `dpl_p39L5Na7sz7ZmJnhJzvMp6mYPbpf`. Database rollback is unnecessary because the migration remains unapplied. If the migration is later approved, rollback requires disabling cleanup first, dropping `claim_expired_form_reviews`, its index, and the six App 6B-3 columns only after confirming no queued cleanup depends on them.
