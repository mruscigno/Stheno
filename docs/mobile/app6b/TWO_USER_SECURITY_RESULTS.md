# Two-user security results

Status: **BLOCKED, not claimed as passed**.

The owner filters and RLS policies are implemented for row read/write/delete, media URL issuance, and deletion. Anonymous or expired authentication is denied by the shared authorization boundary. The Supabase connector refused write/query permission, and Docker/Podman is unavailable locally, so a genuine isolated two-user PostgreSQL run could not be completed in this sprint. The public feature remains off for this reason.

Required activation evidence: user A cannot read, sign, delete, or observe user B's row/object/job state; revoked and expired sessions receive 401/402; retention deletion removes the object and tombstones the row.

