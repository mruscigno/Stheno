# Replay and failure test results

The pgTAP suite passes first commit, identical replay, changed-payload conflict, stale revision, cross-user access, tombstone deletion, stale resurrection rejection, and injected pre-commit rollback. A separate two-process PostgreSQL race submits different operations at revision zero and asserts exactly one commit, one stale conflict, and aggregate revision one. Normalized hashing has unit coverage for key-order stability and mutation sensitivity. No in-memory database is used.
