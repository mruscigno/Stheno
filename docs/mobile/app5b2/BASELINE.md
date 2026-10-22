# App 5B-2 baseline

- Baseline commit: `2e504b7` (`fix: make app 6c policy migration replay-safe`).
- Branch: `product-13-assessment-contact-us-units-content-depth`.
- Working tree before App 5B-2 contained only pre-existing untracked package/evidence directories; they were not modified.
- Assessment source: `src/modules/acquisition/assessment-model.ts`, 45 definitions, version `4.0.0`.
- Canonical exercise invariant: 330 IDs, SHA-256 `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`.
- Purchased media manifest: 298 mappings. The other 32 exercises retain instructions and honest no-video fallback.
- Workout protocol source: App 5A/5B-1/5B-1R migrations, `src/platform/server/workout-operations.ts`, and `/api/v1/workouts/*`.
- App 5B-1R provides stable operation IDs, base revisions, receipts, replay lookup, and transactional domain effects. Native SQLite persistence does not yet exist.
- App 6C APIs and UI exist behind `EXPO_PUBLIC_PROGRESS_V1_ENABLED=false`; production API deployment recorded by App 6C is `dpl_ArqYu8uRpr2GQhRXdAaGGNb523rb`.
- Known Android run `39806733118` passed install/launch/process/UI/logcat checks only. App 6C documentation explicitly says it did not exercise the feature flow.

## API dependency matrix

| Native need | Existing authoritative source | Status |
| --- | --- | --- |
| Assessment/Blueprint/claim | `/api/v1/assessment-sessions/*` | Implemented; not Android end-to-end verified |
| Program/Today | shared v1 member APIs | Implemented; not reached by Android gate |
| Workout start/set/complete | `/api/v1/workouts/sessions*` | Implemented and contract-tested |
| Receipt recovery | `/api/v1/workouts/operations/{operationId}` | Implemented and contract-tested |
| Exercise catalog | `/api/v1/exercises*` | 330 invariant verified |
| Monthly review/photos | App 6C v1 APIs | Implemented; native feature flag off and runtime gate pending |

