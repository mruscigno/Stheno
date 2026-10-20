# Two-user security results

The pgTAP suite creates users A and B. A can mutate A's session but an attempt using B's session ID returns the same not-found result as a nonexistent session. Receipt rows have owner-only select RLS. Direct authenticated access to the private outbox is revoked. Anonymous execution of the transactional RPC is revoked.

Final pass/fail evidence is produced by `app5a-workout-transaction-safety.yml` after push.
