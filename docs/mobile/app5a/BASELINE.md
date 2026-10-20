# Baseline

- Prior API mutation and `api_idempotency_records` insertion were separate calls.
- Set revision was calculated from the caller's value, not locked server state.
- Deletes had no workout-set tombstone.
- Derived work ran inline with no durable outbox boundary.
- App 4.7 gate remains `GO WITH BLOCKERS`; native UI expansion stays gated.
