# Offline conflict and replay results

Deterministic protocol gates cover idempotent operation replay, payload mismatch, stale revision, transactional rollback before/after receipt creation, ordered durable outbox claiming, expired lease recovery, bounded retry, dead-lettering, and redrive. The mobile policy preserves HTTP 409 operations as explicit conflicts and renders a user-safe notice without deleting local work.

The genuine Android A-E replay passed in run `40922283448`, including two offline process deaths and final zero-pending reconciliation. Device-driven response-loss, concurrent-revision conflict, and second-account switching are separately tracked as partial in the scenario matrix. Protocol success alone is not represented as full native acceptance.

