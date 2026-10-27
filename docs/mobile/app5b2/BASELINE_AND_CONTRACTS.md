# Baseline and contracts

- Baseline commit: `4387f716c40643ed7b3664e9b1605ec8342ec12b`.
- Required handoff commit `c6d25f74adce7f1374237d8012104d89ab62d6e4` is an ancestor.
- Server authority remains `private.apply_workout_operation` through the public security-invoker wrapper.
- Stable operation IDs, payload identity, optimistic revisions, durable receipts, tombstones, and server outbox behavior are preserved.
- The native client only calls versioned `/api/v1` routes; it never writes Supabase tables directly.
- Existing assessment, program generation, Coach, billing, and web workout behavior remain authoritative.
