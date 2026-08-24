# Adaptive coaching integration map

This sprint extends the current program, workout, Progress, and Coach surfaces. It does not create replacement routes or duplicate analytics engines.

| Requirement | Current implementation / reuse point | Missing delta | Files, tables, services | Migration | Flag | Verification |
|---|---|---|---|---|---|---|
| Progress inventory | `/app/progress`, `PerformanceIntelligenceExperience`, `ProgressExperience`, monthly reviews, goal projection | Compose a concise coaching snapshot and link explanations/block context | Existing performance API and workload rows; adaptive coaching API | Additive snapshot records only | `recovery_status` | Existing Progress regression plus snapshot tests |
| PR/e1RM/history | `training-intelligence/server`, `exercise_performance_metrics`, `personal_records` | No new engine; preserve across blocks | Existing tables and performance API | None | Existing | Existing analytics tests |
| Muscle workload | `muscle_workload_weekly` and Progress workload panel | Derive qualitative Training Balance and Recovery Status | `adaptive-coaching/engine.ts`, adaptive API | Status snapshots | `recovery_status` | Balance/recovery unit tests |
| Program blocks/phases | `programs`, `program_prescriptions.prescription`, deterministic generator | Add block identity, week, flexible phases, status and continuity metadata | Extend `TrainingProgram`; block API | `training_blocks` | `next_block_priorities` | Phase/block tests |
| Block diffs/completion | Existing program JSON and completed workout summaries | Deterministic program diff, completion summary, next-block proposal | `adaptive-coaching/engine.ts`, block API | `training_block_summaries` | `next_block_priorities` | Block completion tests |
| Next-block priorities | Existing assessment/profile remains authoritative | Structured optional muscle priority input; safety remains authoritative | Block API and Program UI | `training_block_priorities` | `next_block_priorities` | Ownership/RLS and priority tests |
| Recovery feedback/status | Weekly check-in recovery fields, workload, performance, session effort | Throttled observation and qualitative status with reasons | Adaptive API and workout UI | `recovery_observations`, `adaptive_decisions` | `recovery_status` | Recovery edge-case tests |
| Adaptive volume/deload | Existing coaching engine and adaptive-load recommendations | Deterministic HOLD/INCREASE/REDUCE/DELOAD/WAIT decision with evidence and version | Extend pure engine; adaptive API | `adaptive_decisions` | `adaptive_volume`, `deload_intelligence` | Volume/deload tests |
| Exercise progression | `training/progression.ts` and load recommendation persistence | Exercise-specific strategy resolver; no fork | Extend `training/progression.ts` and training-intelligence server consumer | Existing recommendation evidence | `recommendation_explanations` | Strategy tests |
| Adjust today | Existing exercise replace, short-time, travel and plan-adjustment request flows | One structured entry point, today/persistent scope, original/revised preservation | Workout API/UI, existing adaptations | Extend adaptations plus decisions | `adjust_today` | Time/travel/soreness tests |
| Schedule repair | Program calendar and persisted sessions | Deterministic move/continue/skip/reflow choices; no unsafe combining | Adaptive API/UI | `schedule_repair_decisions` | `schedule_repair` | Missed-workout tests |
| Duration intelligence | `duration_seconds`, planned workout minutes | Median mismatch after sufficient sessions; reuse Progress rather than chart duplication | Adaptive API/snapshot | Decision evidence only | `duration_intelligence` | Duration threshold tests |
| Guided mode/warm-ups | Compact logger, shared session/set tables, set type already includes `warmup` | Optional current-set view and persisted preference; no alternate session model | Workout UI/API, `user_preferences` | Preference columns only | `guided_workout` | Shared-persistence test |
| Coach events | Set intelligence, PR events, exercise cues | Deterministic event selection and throttling; Coach only phrases locked facts | Pure engine, workout API/UI | `workout_coach_events` | `workout_coach_events` | Idempotency/throttle tests |
| Explainability | Existing reason codes on coaching, adaptations, recommendations | Shared reason-code formatter and `Why?` disclosures | Adaptive module and UI | Decision evidence | `recommendation_explanations` | Exact-evidence tests |
| Analytics | Typed allowlist and privacy filter | Add structured event names only; never notes, pain, or free text | `modules/analytics/events.ts` | None | Same feature flags | Analytics allowlist/privacy tests |
| Marketing metadata | Typed marketing capability source | Activate only capabilities completed and verified in this sprint | `modules/marketing/capabilities.ts` | None | Capability status | Source review |

## Existing Progress capabilities explicitly reused

- Workout completion and adherence
- Prescribed-set adherence
- Exercise history and comparable loaded-set history
- Estimated 1RM trends
- Personal records and achievements
- Weekly planned-versus-completed muscle workload
- Nutrition adherence and body trends
- Goal projection
- Monthly reviews and progress photos

Progress remains the authoritative route. Progress photos are untouched. The coaching snapshot is a composition of these facts, not a second analytics system.

## Architecture boundary

Deterministic services create decisions, reason codes, algorithm versions, and evidence snapshots. STHENO Coach may turn those locked facts into concise language but cannot create or mutate programming, load, volume, recovery, deload, schedule, phase, or muscle-status decisions from free-form reasoning.
