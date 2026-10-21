#!/usr/bin/env bash
set -euo pipefail
db_container="supabase_db_stheno-app47-local"
user_id="5b1ccccc-1111-4111-8111-111111111111"
session_id="5b1ccccc-0000-4000-8000-000000000001"
event_id="5b1ccccc-0000-4000-8000-000000000101"

docker exec -i "$db_container" psql -U postgres -d postgres >/dev/null <<SQL
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values ('$user_id','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app5b1r-race@example.test','',now(),now(),now()) on conflict do nothing;
set session_replication_role=replica;
insert into public.workout_execution_sessions(id,user_id,program_prescription_id,workout_key,status,original_workout,client_session_key,revision)
values ('$session_id','$user_id','5b1ccccc-0000-4000-8000-000000000099','race','active','{"exercises":[]}','5b1ccccc-0000-4000-8000-000000000011',0) on conflict do nothing;
set session_replication_role=origin;
insert into public.workout_operation_outbox(id,user_id,operation_id,session_id,event_type,payload)
values ('$event_id','$user_id','5b1ccccc-0000-4000-8000-000000000201','$session_id','workout.save_note','{}') on conflict do nothing;
SQL

claim() {
  local worker="$1" output="$2"
  docker exec -i "$db_container" psql -U postgres -d postgres -At >"$output" 2>&1 <<SQL
set role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',false);
select id from public.claim_workout_outbox('$worker',1,60);
SQL
}

mkdir -p artifacts/app5b1r
claim 5b1f0000-0000-4000-8000-000000000001 artifacts/app5b1r/claim-a.txt & a=$!
claim 5b1f0000-0000-4000-8000-000000000002 artifacts/app5b1r/claim-b.txt & b=$!
wait "$a"; wait "$b"

claims=$(grep -h "$event_id" artifacts/app5b1r/claim-{a,b}.txt | wc -l | tr -d ' ')
test "$claims" = 1
docker exec -i "$db_container" psql -U postgres -d postgres -Atc "select attempts from public.workout_operation_outbox where id='$event_id'" | grep -qx 1
