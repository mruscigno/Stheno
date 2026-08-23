# Competitive Gap Closure integration map

## Existing architecture

- Runtime: Next.js 16 App Router on Vercel, React 19, TypeScript, Node.js route handlers.
- Auth/data: Supabase SSR clients in `src/lib/supabase`; authenticated ownership is enforced by `user_id` RLS policies.
- Program truth: `program_prescriptions.prescription` stores the generated `TrainingProgram`; `workout_execution_sessions` stores the immutable original workout plus an optional revised workout.
- Performance truth: `workout_set_logs` stores actual set results separately from the JSON prescription.
- Logger: `/app/workout`, `WorkoutExperience`, and `/api/workouts/today`.
- Exercise metadata: the reviewed exercise catalog and `exercises`/`exercise_muscles` tables provide muscle, pattern, equipment, and progression metadata.
- Progress: `/app/progress` currently combines monthly reviews and weekly coaching assessments.
- Coach: `/api/coach` classifies requests deterministically, retrieves compact member context, and routes plan mutations through `plan_adjustment_requests`.
- Analytics: typed PostHog/HeyCatch-safe events use `src/modules/analytics/events.ts` and server capture helpers.
- Tests: Vitest unit/integration-style route tests, Testing Library, TypeScript, ESLint, and production Next build.
- Responsive shell: mobile breakpoint is 720px; the active workout uses the focused full-session layout.

## Product integration

| Capability | Existing hook | Extension |
|---|---|---|
| Enhanced workout logger | `src/components/workout/workout-experience.tsx`, `/api/workouts/today` | Previous-set grid, persisted recommendations, one-tap prefilled completion, editable completed sets, set types, rest controls, session effort, and real completion summary |
| Adaptive loads | `src/modules/training/progression.ts`, workout history | Pure `training-intelligence` service and persisted `training_load_recommendations`; server remains authoritative |
| PR/e1RM/volume | Existing `personal_records` and `workout_set_logs` | Versioned metrics, source-set identity, idempotent recomputation, invalidation after edits |
| Muscle workload | Reviewed exercise muscle metadata | Versioned weekly planned/completed aggregates derived from prescribed and performed working sets |
| Progress intelligence | `/app/progress` | Real range-based overview, exercise metrics/history, PRs, adherence, frequency, volume, and workload |
| Effort/readiness | Existing RIR and workout adaptation flows | Nullable RIR/RPE, simple completion effort, optional readiness context, pain routes to existing safety behavior |
| Coach context | `/api/coach` structured profile/evidence retrieval | Compact stored training snapshot; deterministic values are locked before model interpretation |
| Feature rollout | No current flag service | Server-readable environment flags with safe defaults for each major surface |
| Backfill | Existing Supabase migrations/scripts | Idempotent bounded SQL backfill for safe historical metrics only, plus dry-run counts |

## Database changes

- Extend `workout_set_logs` and `workout_execution_sessions` additively; old sparse rows remain valid.
- Extend `personal_records` rather than create a parallel PR domain.
- Add `training_load_recommendations`, `exercise_performance_metrics`, `muscle_workload_weekly`, `training_achievements`, and `user_training_preferences` with ownership RLS.
- Keep calculations versioned: `adaptive_load_v1`, `epley_v1`, `pr_v1`, and `set_equivalent_v1`.
- Raw set logs remain the recoverable source of truth; derived records may be safely recomputed or disabled by feature flag.

## Rollback

- UI/API rollback: disable the relevant environment feature flag or revert the application commit.
- Calculation rollback: stop writing the affected algorithm version; retain all raw workout data.
- Migration rollback: drop only the new derived tables/indexes and additive columns after confirming no newer application version depends on them. Never delete workout sessions or set logs.
