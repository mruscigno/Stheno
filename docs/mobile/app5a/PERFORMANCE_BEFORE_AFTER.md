# Performance before and after

Before: each mutation required lookup, domain mutation, side effects, session update, and receipt insertion across multiple network transactions. After: one RPC performs lock, mutation, receipt, and outbox append. Indexes support receipt lookup by `(user_id, operation_id)`, session receipt history, expiry cleanup, and pending outbox scans. CI database lint is a required gate; production latency remains unmeasured until a safe staged deployment exists.
