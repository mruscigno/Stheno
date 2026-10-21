# Synchronous and asynchronous cutover

Synchronous set intelligence, PR calculation, completion workload, and achievements remain enabled so current web responses do not regress. The outbox worker is a durable reconciliation path over the same canonical services.

Duplicate safety:

- Metrics use the existing source-set/version unique key.
- PRs use the existing user/exercise/type/source-set/version unique key.
- Achievements use the existing user/type/session/version unique key.
- Weekly workload no longer adds to prior derived totals. It recomputes the whole UTC week from completed sessions and non-deleted sets, then replaces the derived rows.
- Delete events remove derived metrics and invalidate PRs idempotently.

This permits a crash after an effect but before acknowledgement: retrying produces the same visible state.
