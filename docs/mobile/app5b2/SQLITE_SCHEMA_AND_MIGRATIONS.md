# SQLite schema and migrations

Database: `stheno-workouts-v1.db`; schema/user version: `1`; WAL and foreign keys enabled.

- `local_workout_sessions`: owner ID, local/server session IDs, prescribed workout snapshot, status, server revision, start/rest timestamps, last error.
- `local_workout_sets`: owner/session composite key, stable set ID, performance values, state, sync state.
- `workout_pending_operations`: owner-scoped durable outbox with stable operation ID, canonical SHA-256 payload hash, retry schedule, and error state.
- `workout_local_receipts`: committed server receipt and resulting revision.

No access token, refresh token, password, or service credential is stored in SQLite. Every read and mutation includes `user_id`; session deletion cascades only inside the same composite owner/session key.
