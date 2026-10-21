# Minimal forward migration plan

1. Back up and record queue/workout counts.
2. Apply only `20261020180318`, `20261020192810`, and `20261021154945` in order through an authorized reviewed migration operation. Do not run blanket `db push`, reset, or history repair.
3. Verify columns, functions, grants, RLS, indexes, and zero initial stuck/dead-letter rows.
4. Deploy application code with the worker endpoint and deterministic workload recomputation.
5. Keep synchronous derived calculations enabled for immediate product parity; activate the existing cron as the recovery consumer.

The first migration adds nullable/defaulted columns and new tables. Later migrations alter functions/constraints and add partial indexes. The small current workout tables limit lock exposure, but the release still requires the isolated migration job to pass before production.
