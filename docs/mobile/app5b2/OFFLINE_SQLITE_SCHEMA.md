# Offline SQLite schema

Status: **not implemented** because Phase 1 did not pass.

The eventual schema must namespace every row by authenticated user ID; persist client operation ID, session ID, operation type, canonical payload, base revision, queue state, attempt count, next retry timestamp, receipt/result, and non-secret diagnostic metadata. Authentication tokens remain in SecureStore, never SQLite. Queue state must distinguish pending, in-flight, retryable, conflicted, permanently rejected, reconciled, and superseded without deleting user-entered data.

