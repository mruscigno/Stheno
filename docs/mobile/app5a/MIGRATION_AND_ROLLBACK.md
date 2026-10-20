# Migration and rollback

Apply `20261020180318_app5a_workout_atomic_operations.sql` only after isolated CI is green. The migration is additive. Rollback traffic to the former API handlers before dropping `apply_workout_operation`, outbox/receipt tables, then the new revision/tombstone/note columns. Preserve receipts and tombstones for forensic recovery until all deployed clients have moved off protocol v1.
