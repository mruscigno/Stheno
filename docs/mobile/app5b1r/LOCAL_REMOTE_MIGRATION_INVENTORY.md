# Local and remote migration inventory

`supabase migration list --linked --output-format json` reported 159 combined entries: 76 local-only, 82 remote-only, and one exact version match (`20261019201824`). This reflects the long-standing difference between repository filenames and migrations historically applied through other deployment paths.

Recent relevant versions:

| Version | Local | Remote metadata | Effective production effect |
| --- | --- | --- | --- |
| `20261019201824` | yes | yes | App 3 baseline present |
| `20261020180318` | yes | no | App 5A columns, receipts and outbox absent |
| `20261020192810` | yes | no | App 5B-1 RPCs absent |
| `20261021154945` | yes | no | App 5B-1R worker state absent |

Production schema probes returned PostgreSQL `42703` for both session/set `revision` columns, PostgREST `PGRST205` for `workout_operation_outbox`, and `PGRST202` for `get_workout_operation_receipt`. Table statistics independently omitted both App 5A tables. The workout migrations are therefore semantic gaps, not timestamp-only drift.
