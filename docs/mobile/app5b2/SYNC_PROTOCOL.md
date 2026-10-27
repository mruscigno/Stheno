# Sync protocol

1. Save the local workout/set and outbox operation in one SQLite transaction.
2. Replay operations in creation order. A start receipt binds the local key to the server session.
3. Send the current acknowledged revision with each subsequent mutation.
4. Persist each committed receipt and revision before removing its outbox row.
5. On an ambiguous network failure, query the receipt endpoint with the same operation ID before retrying.
6. Retry transient failures with capped exponential backoff. Preserve HTTP 409 as an explicit conflict; never silently overwrite server state.
7. Resume sync on connectivity changes and retain all local work across process death.

Completion, substitution, and set writes all use the same ordered queue and existing atomic server boundary.
