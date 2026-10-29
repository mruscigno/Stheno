# SQLite, outbox, and receipt results

The current-source journey exports the real debug application's `stheno-workouts-v1.db` plus WAL files at three checkpoints. CI opens each archive with SQLite and asserts:

- first restart: active session, two completed sets, pending offline operations, one owner, no duplicate session key;
- second restart: completed session, three completed sets, queued edit/completion, one owner, no duplicate session key;
- reconciled: completed session, three completed sets, zero pending operations.

The final PostgreSQL gate additionally requires one completed server session, three final set rows, four set receipts including the edit, and one completion receipt. Final values will be recorded after run completion.

