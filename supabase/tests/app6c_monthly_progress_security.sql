begin;
select plan(12);

select has_column('public','monthly_reviews','revision','monthly intake has optimistic revision');
select has_column('public','progress_photo_sets','consent_scope','photo consent scope is explicit');
select has_table('public','monthly_review_decisions','decision receipt table exists');
select ok(not has_table_privilege('anon','public.monthly_review_decisions','select'),'anonymous users cannot read decision receipts');
select ok(not has_function_privilege('anon','public.apply_monthly_review_decision(uuid,uuid,text,uuid[])','execute'),'anonymous users cannot apply decisions');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('6c111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app6c-a@example.test','',now(),now(),now()),
('6c222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app6c-b@example.test','',now(),now(),now());
insert into public.monthly_reviews(id,user_id,period_start,period_end,due_at,status) values
('6c100000-0000-4000-8000-000000000001','6c111111-1111-4111-8111-111111111111',current_date-27,current_date,now(),'completed'),
('6c200000-0000-4000-8000-000000000002','6c222222-2222-4222-8222-222222222222',current_date-27,current_date,now(),'completed');
insert into public.monthly_recommendations(id,user_id,monthly_review_id,type,scope,before_state,after_state,reason_codes,plain_language_reason) values
('6c100000-0000-4000-8000-000000000011','6c111111-1111-4111-8111-111111111111','6c100000-0000-4000-8000-000000000001','deload_recovery','training','{"demand":"current"}','{"demand":"reduced"}',array['RECOVERY_SIGNAL_REPEATED'],'Reduce demand for one week.'),
('6c200000-0000-4000-8000-000000000012','6c222222-2222-4222-8222-222222222222','6c200000-0000-4000-8000-000000000002','deload_recovery','training','{"demand":"current"}','{"demand":"reduced"}',array['RECOVERY_SIGNAL_REPEATED'],'Reduce demand for one week.');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"6c111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select results_eq($$select id from public.monthly_reviews order by id$$,$$values ('6c100000-0000-4000-8000-000000000001'::uuid)$$,'A sees only A review');
select throws_ok($$select public.apply_monthly_review_decision('6c200000-0000-4000-8000-000000000002','6c100000-0000-4000-8000-000000000099','keep','{}')$$,'P0001','NOT_FOUND','A cannot decide B review');
select lives_ok($$select public.apply_monthly_review_decision('6c100000-0000-4000-8000-000000000001','6c100000-0000-4000-8000-000000000098','apply',array['6c100000-0000-4000-8000-000000000011'::uuid])$$,'owner applies selected recommendation');
select is((select status from public.monthly_recommendations where id='6c100000-0000-4000-8000-000000000011'),'accepted','recommendation committed');
select is((select count(*)::int from public.coach_decisions where structured_inputs->>'monthly_review_id'='6c100000-0000-4000-8000-000000000001'),1,'coach decision written exactly once');
select lives_ok($$select public.apply_monthly_review_decision('6c100000-0000-4000-8000-000000000001','6c100000-0000-4000-8000-000000000098','apply',array['6c100000-0000-4000-8000-000000000011'::uuid])$$,'retry returns stored receipt');
select is((select count(*)::int from public.coach_decisions where structured_inputs->>'monthly_review_id'='6c100000-0000-4000-8000-000000000001'),1,'retry does not duplicate coach decision');

select * from finish();
rollback;
