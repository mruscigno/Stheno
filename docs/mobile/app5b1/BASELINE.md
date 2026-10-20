# Baseline and traceability

- Baseline commit: `883e71268209599e5d12688a639031ca9ff4aa27`.
- App 5A migrations: `20261020180318_app5a_workout_atomic_operations.sql`.
- App 1 contracts: `src/platform/contracts/api.ts`, `docs/mobile/app1/openapi.json`.
- v1 routes: `src/app/api/v1/workouts/**`.
- legacy web route: `src/app/api/workouts/today/route.ts` (previously a separate write engine).
- web caller: `src/components/workout/workout-experience.tsx`.
- isolated environment: `supabase/config.toml`, project ID `stheno-app47-local`.
- canonical exercise baseline: exactly 330 IDs, SHA-256 `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`.
- purchased media mappings baseline: 298.
