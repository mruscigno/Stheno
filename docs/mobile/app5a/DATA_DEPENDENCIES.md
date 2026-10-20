# Data dependencies

`workout_execution_sessions` is the aggregate root. Set logs and adaptations belong to it. `workout_operation_receipts` binds a principal and operation UUID to one normalized payload hash and immutable result. `workout_operation_outbox` records one follow-up event in the same commit so achievements, workload, notifications, and other derived effects can be processed idempotently outside the user request.
