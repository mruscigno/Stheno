# Competitive gap closure release

## Shipped surface

- Full-session workout logger with prior sets, deterministic recommendations, editing, added sets, rest controls, effort feedback, and explicit completion.
- Versioned Epley estimated 1RM, set volume, personal records, adaptive loads, weekly muscle workload, and achievement facts.
- Performance overview with date ranges, exercise detail, PR history, planned-versus-completed workload, and accessible text equivalents.
- Structured training facts supplied to STHENO Coach without allowing the language layer to invent metrics.

## Versions and flags

- `adaptive_load_v1`, `epley_v1`, `pr_v1`, `set_equivalent_v1`, `workout_summary_v1`.
- Kill switches default on and may be disabled with the corresponding `NEXT_PUBLIC_*` or server feature flag variables in `src/modules/training-intelligence/flags.ts`.

## Production data release

- Additive schema migration: `20260823202127_competitive_gap_training_intelligence.sql`.
- Historical metrics backfill: `20260823203848_competitive_gap_safe_metrics_backfill.sql`.
- Historical PR and workload backfill: `20260823203938_competitive_gap_safe_pr_workload_backfill.sql`.
- Live preflight observed 2 completed sessions and 13 valid sets; all source workout rows remain immutable.
- Future operator dry run: `pnpm backfill:training:dry-run`. Apply mode requires a scoped server secret and is `pnpm backfill:training:apply`.

## Monitoring and rollback

- Monitor workout API error rates, set save latency, completion failures, recommendation acceptance, and progress API failures.
- Disable individual user-facing modules with feature flags before rollback.
- Derived tables may be left in place safely; old clients ignore additive columns. Never roll back by deleting raw sessions or set logs.
- If a derived algorithm is replaced, preserve prior versioned rows and write the successor version beside them.
