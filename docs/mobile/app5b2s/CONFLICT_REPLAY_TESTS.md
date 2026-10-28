# Conflict and replay tests

Source contracts retain idempotent operation IDs, receipt lookup, revision-aware writes, retry classification and local conflict preservation. Root tests pass 245/245 and mobile tests pass 20/20.

Native duplicate, timeout-after-commit and stale-revision evidence remain pending the fresh Android gate. They will not be reported as passed based only on source tests.
