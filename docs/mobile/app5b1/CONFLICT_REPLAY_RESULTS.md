# Conflict and replay results

The real PostgreSQL suite asserts identical replay, changed-payload rejection, stale revision, tombstone protection, failure rollback, cross-user not-found behavior, and one-winner concurrent revision races. App 5B-1 adds structural tests for private/public RPC separation and receipt permissions. All database suites and the concurrent race passed in CI run [39485319036](https://github.com/mruscigno/Stheno/actions/runs/39485319036).
