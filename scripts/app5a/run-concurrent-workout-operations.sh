#!/usr/bin/env bash
set -euo pipefail
db_container="supabase_db_stheno-app47-local"
user_id="5acccccc-1111-4111-8111-111111111111"
session_id="5acccccc-0000-4000-8000-000000000001"

docker exec -i "$db_container" psql -U postgres -d postgres >/dev/null <<SQL
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values ('$user_id','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app5a-race@example.test','',now(),now(),now()) on conflict do nothing;
set session_replication_role=replica;
insert into public.workout_execution_sessions(id,user_id,program_prescription_id,workout_key,status,original_workout,client_session_key,revision)
values ('$session_id','$user_id','5acccccc-0000-4000-8000-000000000099','race','active','{"exercises":[]}','5acccccc-0000-4000-8000-000000000011',0) on conflict do nothing;
SQL

run_op() {
  local op_id="$1" note="$2" output="$3"
  docker exec -i "$db_container" psql -U postgres -d postgres >"$output" 2>&1 <<SQL || true
set session_replication_role=replica;
set role authenticated;
select set_config('request.jwt.claims','{"sub":"$user_id","role":"authenticated"}',false);
select public.apply_workout_operation('$op_id','$session_id','save_note',0,1,now(),'{"note":"$note"}','$(printf '%064d' "$note")');
SQL
}

mkdir -p artifacts/app5a
run_op 5acccccc-0000-4000-8000-000000000101 1 artifacts/app5a/race-a.txt & a=$!
run_op 5acccccc-0000-4000-8000-000000000102 2 artifacts/app5a/race-b.txt & b=$!
wait "$a"; wait "$b"

commits=$(grep -l 'receiptState' artifacts/app5a/race-{a,b}.txt | wc -l | tr -d ' ')
conflicts=$(grep -l 'STALE_REVISION' artifacts/app5a/race-{a,b}.txt | wc -l | tr -d ' ')
test "$commits" = 1
test "$conflicts" = 1
docker exec -i "$db_container" psql -U postgres -d postgres -Atc "select revision from public.workout_execution_sessions where id='$session_id'" | grep -qx 1
