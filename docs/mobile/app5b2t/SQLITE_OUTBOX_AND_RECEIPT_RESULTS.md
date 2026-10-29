# SQLite, outbox, and receipt results

The current-source journey exports the real debug application's `stheno-workouts-v1.db` plus WAL files at three checkpoints. CI opens each archive with SQLite and asserts:

- first restart: active session, three completed sets, two pending offline operations, one owner, no duplicate session key;
- second restart: completed session, three completed sets, queued edit/completion, one owner, no duplicate session key;
- reconciled: completed session, three completed sets, zero pending operations.

Run `40922283448` produced:

- `13-first-kill-restored`: `status=active completed_sets=3 pending=2 synced=1 owners=1 duplicate_sessions=0`;
- `15-second-kill-restored`: `status=completed completed_sets=3 pending=4 synced=1 owners=1 duplicate_sessions=0`;
- `16-reconciled`: `status=completed completed_sets=3 pending=0 synced=3 owners=1 duplicate_sessions=0`.

The final PostgreSQL gate passed with one claimed assessment, one assessment, one program, one completed replay-safe server session, three final set rows, four set receipts including the edit, and one canonical `complete_session` receipt.

