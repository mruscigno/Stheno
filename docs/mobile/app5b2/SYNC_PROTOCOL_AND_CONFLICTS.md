# Sync protocol and conflicts

App 5B-2 must consume, not replace, App 5B-1R. A native operation is persisted before acknowledgement, delivered with a stable operation ID and base revision, and reconciled through the operation receipt endpoint after ambiguous responses. A duplicate with the same canonical payload reuses the receipt; changed payload under the same ID is a permanent error; stale revision is an explicit conflict; transient transport/5xx failures back off; logout freezes and isolates that user's queue.

No implementation was added before the runtime gate. This prevents a second, unverified outbox from diverging from the deployed transaction protocol.

