begin;
select plan(25);

select has_column('public','workout_operation_outbox','status','delivery status exists');
select has_column('public','workout_operation_outbox','lease_owner','lease owner exists');
select has_column('public','workout_operation_outbox','lease_expires_at','lease expiry exists');
select has_column('public','workout_operation_outbox','next_attempt_at','retry schedule exists');
select has_column('public','workout_operation_outbox','dead_lettered_at','dead-letter timestamp exists');
select has_table('private','workout_outbox_effect_receipts','private effect receipts exist');
select has_function('public','claim_workout_outbox',array['uuid','integer','integer'],'claim function exists');
select has_function('public','ack_workout_outbox',array['uuid','uuid','text'],'ack function exists');
select has_function('public','fail_workout_outbox',array['uuid','uuid','text','boolean'],'failure function exists');
select has_function('public','redrive_workout_outbox',array['uuid'],'redrive function exists');
select ok(not has_function_privilege('authenticated','public.claim_workout_outbox(uuid,integer,integer)','execute'),'member cannot claim outbox');
select ok(has_function_privilege('service_role','public.claim_workout_outbox(uuid,integer,integer)','execute'),'service role can claim outbox');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('5b1a1111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app5b1r-a@example.test','',now(),now(),now()),
 ('5b1b2222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app5b1r-b@example.test','',now(),now(),now());
set session_replication_role=replica;
insert into public.workout_execution_sessions(id,user_id,program_prescription_id,workout_key,status,original_workout,client_session_key,revision) values
 ('5b1a0000-0000-4000-8000-000000000001','5b1a1111-1111-4111-8111-111111111111','5b1a0000-0000-4000-8000-000000000099','a','active','{"exercises":[]}','5b1a0000-0000-4000-8000-000000000011',0),
 ('5b1b0000-0000-4000-8000-000000000002','5b1b2222-2222-4222-8222-222222222222','5b1b0000-0000-4000-8000-000000000099','b','active','{"exercises":[]}','5b1b0000-0000-4000-8000-000000000012',0);
set session_replication_role=origin;
insert into public.workout_operation_outbox(id,user_id,operation_id,session_id,event_type,payload,created_at) values
 ('5b1a0000-0000-4000-8000-000000000101','5b1a1111-1111-4111-8111-111111111111','5b1a0000-0000-4000-8000-000000000201','5b1a0000-0000-4000-8000-000000000001','workout.save_note','{}',now()-interval '3 minutes'),
 ('5b1a0000-0000-4000-8000-000000000102','5b1a1111-1111-4111-8111-111111111111','5b1a0000-0000-4000-8000-000000000202','5b1a0000-0000-4000-8000-000000000001','workout.save_note','{}',now()-interval '2 minutes'),
 ('5b1b0000-0000-4000-8000-000000000103','5b1b2222-2222-4222-8222-222222222222','5b1b0000-0000-4000-8000-000000000203','5b1b0000-0000-4000-8000-000000000002','workout.save_note','{}',now()-interval '1 minute');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"5b1a1111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select ok(not has_table_privilege('authenticated','public.workout_operation_outbox','select'),'members cannot read outbox rows');
reset role;
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);

create temporary table claimed as select * from public.claim_workout_outbox('5b1f0000-0000-4000-8000-000000000001',10,60);
select is((select count(*)::int from claimed),2,'claim selects one head event per session');
select ok(exists(select 1 from claimed where id='5b1a0000-0000-4000-8000-000000000101'),'oldest event for session is claimed');
select ok(not exists(select 1 from claimed where id='5b1a0000-0000-4000-8000-000000000102'),'later same-session event remains ordered');
select is((select attempts from public.workout_operation_outbox where id='5b1a0000-0000-4000-8000-000000000101'),1,'claim increments attempts');
select ok(public.ack_workout_outbox('5b1a0000-0000-4000-8000-000000000101','5b1f0000-0000-4000-8000-000000000001','test-v1'),'lease owner acknowledges event');
select is((select status from public.workout_operation_outbox where id='5b1a0000-0000-4000-8000-000000000101'),'processed','ack marks processed');
select is((select count(*)::int from private.workout_outbox_effect_receipts where event_id='5b1a0000-0000-4000-8000-000000000101'),1,'ack records one effect receipt');

update public.workout_operation_outbox set lease_expires_at=now()-interval '1 second' where id='5b1b0000-0000-4000-8000-000000000103';
select is((select count(*)::int from public.claim_workout_outbox('5b1f0000-0000-4000-8000-000000000002',10,60) where id='5b1b0000-0000-4000-8000-000000000103'),1,'expired lease is recovered');
select is(public.fail_workout_outbox('5b1b0000-0000-4000-8000-000000000103','5b1f0000-0000-4000-8000-000000000002','TRANSIENT',false),'pending','transient failure schedules retry');

update public.workout_operation_outbox set status='processing',lease_owner='5b1f0000-0000-4000-8000-000000000003',attempts=max_attempts where id='5b1b0000-0000-4000-8000-000000000103';
select is(public.fail_workout_outbox('5b1b0000-0000-4000-8000-000000000103','5b1f0000-0000-4000-8000-000000000003','POISON',false),'dead_letter','bounded retry parks poison event');
select ok(public.redrive_workout_outbox('5b1b0000-0000-4000-8000-000000000103'),'dead letter can be safely re-driven');
select is((select status from public.workout_operation_outbox where id='5b1b0000-0000-4000-8000-000000000103'),'pending','redrive resets pending state');

select * from finish();
rollback;
