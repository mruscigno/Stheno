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
  local status sets pending owners duplicate_sessions
  status="$(sqlite3 "$db" "select status from local_workout_sessions order by updated_at desc limit 1")"
  sets="$(sqlite3 "$db" "select count(*) from local_workout_sets where state='completed'")"
  pending="$(sqlite3 "$db" "select count(*) from workout_pending_operations where state in ('pending','sending','conflict')")"
  owners="$(sqlite3 "$db" "select count(distinct user_id) from local_workout_sessions")"
  duplicate_sessions="$(sqlite3 "$db" "select count(*) from (select user_id,local_session_key,count(*) c from local_workout_sessions group by user_id,local_session_key having c>1)")"
  test "$status" = "$expected_status"
  test "$sets" -eq "$expected_sets"
  test "$pending" -ge "$min_pending"
  test "$owners" -eq 1
  test "$duplicate_sessions" -eq 0
  printf '%s status=%s completed_sets=%s pending=%s owners=%s duplicate_sessions=%s\n' "$label" "$status" "$sets" "$pending" "$owners" "$duplicate_sessions" | tee -a "$output"
}

assert_snapshot "$STHENO_E2E_EVIDENCE/13-first-kill-restored-sqlite.tar" active 2 2
assert_snapshot "$STHENO_E2E_EVIDENCE/15-second-kill-restored-sqlite.tar" completed 3 3
assert_snapshot "$STHENO_E2E_EVIDENCE/16-reconciled-sqlite.tar" completed 3 0

