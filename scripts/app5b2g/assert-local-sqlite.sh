#!/usr/bin/env bash
set -euo pipefail

: "${STHENO_E2E_EVIDENCE:?STHENO_E2E_EVIDENCE is required}"
output="${STHENO_E2E_EVIDENCE%/android}/database/local-sqlite-assertions.txt"
mkdir -p "$(dirname "$output")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

assert_snapshot() {
  local archive="$1" expected_status="$2" expected_sets="$3" min_pending="$4"
  local label
  label="$(basename "$archive" -sqlite.tar)"
  mkdir -p "$work/$label"
  tar -xf "$archive" -C "$work/$label"
  local db
  db="$(find "$work/$label" -type f -name 'stheno-workouts-v1.db' -print -quit)"
  test -n "$db"
  local status sets pending synced owners duplicate_sessions
  status="$(sqlite3 "$db" "
    select s.status
    from local_workout_sessions s
    order by (
      select count(*)
      from local_workout_sets ws
      where ws.user_id = s.user_id
        and ws.local_session_key = s.local_session_key
        and ws.state = 'completed'
    ) desc, s.updated_at desc
    limit 1
  ")"
  sets="$(sqlite3 "$db" "select count(*) from local_workout_sets where state='completed'")"
  pending="$(sqlite3 "$db" "select count(*) from workout_pending_operations where state in ('pending','sending','conflict')")"
  synced="$(sqlite3 "$db" "select count(*) from local_workout_sets where state='completed' and sync_state='synced'")"
  owners="$(sqlite3 "$db" "select count(distinct user_id) from local_workout_sessions")"
  duplicate_sessions="$(sqlite3 "$db" "select count(*) from (select user_id,local_session_key,count(*) c from local_workout_sessions group by user_id,local_session_key having c>1)")"
  printf '%s status=%s completed_sets=%s pending=%s synced=%s owners=%s duplicate_sessions=%s\n' "$label" "$status" "$sets" "$pending" "$synced" "$owners" "$duplicate_sessions" | tee -a "$output"
  test "$status" = "$expected_status"
  test "$sets" -eq "$expected_sets"
  test "$pending" -ge "$min_pending"
  test "$owners" -eq 1
  test "$duplicate_sessions" -eq 0
  if [ "$min_pending" -eq 0 ]; then
    test "$pending" -eq 0
    test "$synced" -eq "$expected_sets"
  fi
}

assert_conflict_snapshot() {
  local archive="$1" label db conflict_sessions conflict_ops owners
  label="$(basename "$archive" -sqlite.tar)"
  mkdir -p "$work/$label-conflict"
  tar -xf "$archive" -C "$work/$label-conflict"
  db="$(find "$work/$label-conflict" -type f -name 'stheno-workouts-v1.db' -print -quit)"
  test -n "$db"
  conflict_sessions="$(sqlite3 "$db" "select count(*) from local_workout_sessions where status='conflict'")"
  conflict_ops="$(sqlite3 "$db" "select count(*) from workout_pending_operations where state='conflict'")"
  owners="$(sqlite3 "$db" "select count(distinct user_id) from local_workout_sessions")"
  printf '%s conflict_sessions=%s conflict_ops=%s local_workout_owners=%s\n' "$label" "$conflict_sessions" "$conflict_ops" "$owners" | tee -a "$output"
  test "$conflict_sessions" -eq 1
  test "$conflict_ops" -eq 1
  test "$owners" -eq 1
}

assert_snapshot "$STHENO_E2E_EVIDENCE/13-first-kill-restored-sqlite.tar" active 3 1
assert_snapshot "$STHENO_E2E_EVIDENCE/15-second-kill-restored-sqlite.tar" completed 3 3
assert_snapshot "$STHENO_E2E_EVIDENCE/16-reconciled-sqlite.tar" completed 3 0
assert_snapshot "$STHENO_E2E_EVIDENCE/18-conflict-preserved-sqlite.tar" completed 4 1
assert_conflict_snapshot "$STHENO_E2E_EVIDENCE/18-conflict-preserved-sqlite.tar"
assert_snapshot "$STHENO_E2E_EVIDENCE/19-second-user-isolated-sqlite.tar" completed 4 1
assert_conflict_snapshot "$STHENO_E2E_EVIDENCE/19-second-user-isolated-sqlite.tar"
assert_snapshot "$STHENO_E2E_EVIDENCE/20-first-user-restored-sqlite.tar" completed 4 1
assert_conflict_snapshot "$STHENO_E2E_EVIDENCE/20-first-user-restored-sqlite.tar"

