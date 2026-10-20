# Replay and failure test results

The suite covers first commit, identical replay, changed-payload conflict, stale revision, cross-user access, tombstone deletion, stale resurrection rejection, and injected pre-commit rollback. Normalized hashing has unit coverage for key-order stability and mutation sensitivity. CI is the authority for real PostgreSQL execution; no in-memory database is used.
