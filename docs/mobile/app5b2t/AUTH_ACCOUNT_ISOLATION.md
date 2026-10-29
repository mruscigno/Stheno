# Authentication and account isolation

- CI uses a per-run `example.test` account in disposable local Supabase; no production credential or customer data enters the job.
- Native offline bootstrap represents a previously authenticated cached identity, not a new entitlement.
- SQLite sessions, sets, operations, and receipts are keyed by `user_id`.
- Server writes derive ownership from authenticated claims; client-provided user IDs do not authorize writes.
- Existing two-user RLS and receipt-ownership SQL gates remain mandatory.

The complete second-account native switch remains a hard Android gate and must be reported as pending until genuine device evidence exists.

