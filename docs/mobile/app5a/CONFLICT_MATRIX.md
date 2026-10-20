# Conflict matrix

| Situation | Result |
|---|---|
| Same principal + operation ID + hash | Original receipt, `replayed: true` |
| Same principal + operation ID + changed hash | 409 `IDEMPOTENCY_CONFLICT` |
| Foreign session | 404 without ownership disclosure |
| Base revision behind/ahead | 409 with expected/received revision detail |
| Late set after completion | 409 |
| Stale upsert after tombstone | 409; no resurrection |
| Two different valid operations serialized | Locked, monotonically revised commits |
