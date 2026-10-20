# Conflict and replay results

The real PostgreSQL suite asserts identical replay, changed-payload rejection, stale revision, tombstone protection, failure rollback, cross-user not-found behavior, and one-winner concurrent revision races. App 5B-1 adds structural tests for private/public RPC separation and receipt permissions. Final commands and CI run are recorded in `FINAL_STATUS.md`.
