# Offline replay and conflict results

- Native offline write: **PASS**. Run `40756034444` saved set 1 while Wi-Fi and data were disabled and exposed `Workout sync status: Offline · saved locally`.
- SQLite/process-kill continuation: **BLOCKED**. After force-stop and offline relaunch, the persisted Supabase session exists but `AuthProvider` waits for online member/today/program/nutrition/progress calls. The app therefore cannot recover the user ID needed to load the local workout.
- Ordered replay, receipt acknowledgement, duplicate delivery, stale-revision conflict, completion and history: **NOT REACHED** in native runtime.
- Source-level SQLite/outbox policy and workout operation tests remain passing, but are not relabeled as native proof.

Exact next implementation: persist a user-scoped, versioned member bootstrap/read-model cache; allow a valid persisted Supabase session to enter an explicit offline-authenticated state; derive local workout ownership from `session.user.id`; route directly to the active local workout when offline. Then rerun the same gate through replay, conflict, completion and cold restart.
