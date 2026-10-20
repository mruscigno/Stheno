begin;
select plan(15);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('5a111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app5a-a@example.test','',now(),now(),now()),
 ('5a222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app5a-b@example.test','',now(),now(),now());

-- Fixture only: bypass the prescription FK so the suite isolates the App 5A boundary.
set session_replication_role=replica;
insert into public.workout_execution_sessions(id,user_id,program_prescription_id,workout_key,status,original_workout,client_session_key,revision)
values
 ('5a100000-0000-4000-8000-000000000001','5a111111-1111-4111-8111-111111111111','5a100000-0000-4000-8000-000000000099','upper-a','active','{"exercises":[{"exerciseSlug":"bench-press","sets":1}]}','5a100000-0000-4000-8000-000000000011',0),
 ('5a200000-0000-4000-8000-000000000002','5a222222-2222-4222-8222-222222222222','5a200000-0000-4000-8000-000000000099','upper-a','active','{"exercises":[{"exerciseSlug":"bench-press","sets":1}]}','5a200000-0000-4000-8000-000000000012',0);
set session_replication_role=origin;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"5a111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select lives_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000101','5a100000-0000-4000-8000-000000000001','upsert_set',0,1,now(),'{"setId":"5a100000-0000-4000-8000-000000000201","exerciseSlug":"bench-press","setOrdinal":1,"setType":"working","prescribed":{},"load":100,"loadUnit":"lb","repetitions":8,"rir":2,"state":"completed"}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')$$,'first set commits');
select is((select count(*)::int from public.workout_set_logs where id='5a100000-0000-4000-8000-000000000201'),1,'one domain row');
select is((select count(*)::int from public.workout_operation_receipts where operation_id='5a100000-0000-4000-8000-000000000101'),1,'receipt committed with domain row');
select hasnt_table_privilege('authenticated','public.workout_operation_outbox','select','outbox is private from direct clients');
select lives_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000101','5a100000-0000-4000-8000-000000000001','upsert_set',0,1,now(),'{"setId":"5a100000-0000-4000-8000-000000000201","exerciseSlug":"bench-press","setOrdinal":1,"setType":"working","prescribed":{},"load":100,"loadUnit":"lb","repetitions":8,"rir":2,"state":"completed"}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')$$,'identical replay succeeds despite stale base revision');
select is((select count(*)::int from public.workout_set_logs where id='5a100000-0000-4000-8000-000000000201'),1,'replay creates no duplicate');
select throws_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000101','5a100000-0000-4000-8000-000000000001','upsert_set',1,1,now(),'{"setId":"5a100000-0000-4000-8000-000000000201","exerciseSlug":"bench-press","setOrdinal":1,"setType":"working","prescribed":{},"load":105,"loadUnit":"lb","repetitions":8,"rir":2,"state":"completed"}','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')$$,'P0001','IDEMPOTENCY_CONFLICT','changed payload conflicts');
select throws_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000102','5a100000-0000-4000-8000-000000000001','save_note',0,1,now(),'{"note":"stale"}','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc')$$,'P0001','STALE_REVISION','stale revision conflicts');
select throws_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000103','5a200000-0000-4000-8000-000000000002','save_note',0,1,now(),'{"note":"attack"}','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd')$$,'P0002','WORKOUT_NOT_FOUND','cross-user session is not disclosed');
select lives_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000104','5a100000-0000-4000-8000-000000000001','delete_set',1,1,now(),'{"setId":"5a100000-0000-4000-8000-000000000201"}','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')$$,'delete commits tombstone');
select isnt((select deleted_at::text from public.workout_set_logs where id='5a100000-0000-4000-8000-000000000201'),null,'tombstone retained');
select throws_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000105','5a100000-0000-4000-8000-000000000001','upsert_set',1,1,now(),'{"setId":"5a100000-0000-4000-8000-000000000201","exerciseSlug":"bench-press","setOrdinal":1,"state":"completed"}','ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')$$,'P0001','STALE_REVISION','stale upsert cannot resurrect tombstone');
select throws_ok($$select public.apply_workout_operation('5a100000-0000-4000-8000-000000000106','5a100000-0000-4000-8000-000000000001','save_note',2,1,now(),'{"note":"must roll back","testFailurePoint":"before_commit"}','1111111111111111111111111111111111111111111111111111111111111111')$$,'P0001','INJECTED_BEFORE_COMMIT_FAILURE','injected failure aborts');
select is((select count(*)::int from public.workout_operation_receipts where operation_id='5a100000-0000-4000-8000-000000000106'),0,'failure leaves no receipt');
select is((select session_note from public.workout_execution_sessions where id='5a100000-0000-4000-8000-000000000001'),null,'failure rolls back domain write');

select * from finish();
rollback;
