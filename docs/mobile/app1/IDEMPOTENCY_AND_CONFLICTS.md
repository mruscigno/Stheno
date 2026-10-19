# Idempotency and Conflicts

## Contract

Replayable mutations require a client-generated UUID. The server scopes it to the authenticated user and logical resource, hashes the normalized payload, and stores the canonical response. Identical replay returns the same logical result; reusing the ID with changed content returns `409 IDEMPOTENCY_CONFLICT`.

Start also relies on unique `(user_id, client_session_key)`. Set writes retain unique `(user_id, idempotency_key)` and stable client `setId`. Completion checks terminal session state. Monthly recommendations transition from `pending` only once before effects are applied.

Acknowledgments include operation ID, revision, server timestamp, canonical IDs, and replay status. Clients must process acknowledgments before removing local outbox entries.

## Conflict policy

- A completed workout rejects later set writes.
- The same set ID may be edited only within its owned session; a distinct operation ID represents a new edit intent.
- Out-of-order operations are accepted only while the session is mutable; current App 1 revisions are contract foundations, not a complete offline merge algorithm.
- Selective monthly decisions validate every selected recommendation and ignore already-decided rows rather than applying effects twice.
- Plan prescriptions remain server-authoritative snapshots.

## Known hardening item

The receipt insert and all multi-table derived effects are not yet one Postgres transaction. Existing domain unique constraints and state transitions prevent primary duplicates, but an App 5 sync migration should reserve/finalize operations inside database functions or a transactional service and add stale in-progress recovery. Native offline availability must not be claimed until concurrent, timeout-after-commit, and multi-device integration tests run against a migrated test database.

Receipts expire after 90 days. Retention must remain longer than the supported offline retry window.
