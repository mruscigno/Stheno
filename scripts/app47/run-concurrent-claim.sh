#!/usr/bin/env bash
set -euo pipefail

container="supabase_db_stheno-app47-local"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
evidence="$root/artifacts/app47/supabase"
mkdir -p "$evidence"

docker exec -i "$container" psql -U postgres -d postgres < "$root/scripts/app47/concurrent-claim-setup.sql"

docker exec -i "$container" psql -U postgres -d postgres < "$root/scripts/app47/concurrent-claim-a.sql" > "$evidence/concurrent-a.txt" 2>&1 &
pid_a=$!
sleep 0.5
set +e
docker exec -i "$container" psql -U postgres -d postgres < "$root/scripts/app47/concurrent-claim-b.sql" > "$evidence/concurrent-b.txt" 2>&1
status_b=$?
wait "$pid_a"
status_a=$?
set -e

test "$status_a" -eq 0
test "$status_b" -ne 0
grep -q "already_claimed_by_another_account" "$evidence/concurrent-b.txt"

result="$(docker exec "$container" psql -U postgres -d postgres -Atc "select count(*)::text || '|' || claimed_by::text from public.assessments a join public.anonymous_assessment_sessions s on s.id=a.source_anonymous_session_id where s.id='c4777777-3333-4333-8333-333333333333' group by claimed_by")"
test "$result" = "1|a4777777-1111-4111-8111-111111111111"
printf 'winner=%s\nloser_exit=%s\n' "$result" "$status_b" > "$evidence/concurrent-result.txt"

