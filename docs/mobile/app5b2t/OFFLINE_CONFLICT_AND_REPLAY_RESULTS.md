# Offline conflict and replay results

Deterministic protocol gates cover idempotent operation replay, payload mismatch, stale revision, transactional rollback before/after receipt creation, ordered durable outbox claiming, expired lease recovery, bounded retry, dead-lettering, and redrive. The mobile policy preserves HTTP 409 operations as explicit conflicts and renders a user-safe notice without deleting local work.

The genuine Android A-E replay and a device-driven concurrent-revision conflict are separately tracked in the scenario matrix. Protocol success alone is not represented as full native acceptance.

