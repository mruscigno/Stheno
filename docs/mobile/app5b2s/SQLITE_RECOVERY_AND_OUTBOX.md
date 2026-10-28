# SQLite recovery and outbox

- Workout ownership now derives from the persisted Supabase session user ID, not an unavailable online member read model.
- Recovery selects active/conflicted workouts and locally completed workouts that still have pending/sending/conflict operations.
- Local set state and outbox enqueue remain in the existing SQLite transaction.
- Outbox sync is single-flight per user to prevent concurrent network callbacks from racing ordered operations.
- Pending operations remain owner-scoped and survive sign-out, process kill, transient errors and reauthentication.
- Acknowledged operations retain local receipts; retry uses the existing idempotent server receipt contract.
