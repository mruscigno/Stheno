begin;
select plan(13);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('6b111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app6b1-a@example.test','',now(),now(),now()),
 ('6b222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app6b1-b@example.test','',now(),now(),now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"6b111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.coach_form_reviews(id,user_id,exercise_id,exercise_slug,object_path,consent_version,consented_at,camera_view,byte_size,media_type,rubric_version,idempotency_key,upload_expires_at,retention_delete_at)
select '6b100000-0000-4000-8000-000000000001','6b111111-1111-4111-8111-111111111111',id,slug,'6b111111-1111-4111-8111-111111111111/6b100000-0000-4000-8000-000000000001/set.mp4','2026.10-app6b.1',now(),'side',1000,'video/mp4','2026.10.1','app6b1-security-a',now()+interval '2 hours',now()+interval '30 days' from public.exercises where slug='goblet-squat';
select is((select count(*)::int from public.coach_form_reviews where id='6b100000-0000-4000-8000-000000000001'),1,'A reads own review');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"6b222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select is_empty($$select id from public.coach_form_reviews where id='6b100000-0000-4000-8000-000000000001'$$,'B cannot read A review');
update public.coach_form_reviews set member_question='attack' where id='6b100000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.coach_form_reviews where member_question='attack'),0,'B cannot modify A review');
delete from public.coach_form_reviews where id='6b100000-0000-4000-8000-000000000001';
select is_empty($$select id from public.coach_form_reviews where id='6b100000-0000-4000-8000-000000000001'$$,'B sees no row after denied delete');
select ok(not has_function_privilege('authenticated','public.claim_form_review_jobs(integer,integer)','execute'),'clients cannot claim worker jobs');
select ok(not has_function_privilege('anon','public.claim_form_review_jobs(integer,integer)','execute'),'anonymous users cannot claim worker jobs');

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"6b111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select is((select count(*)::int from public.coach_form_reviews where id='6b100000-0000-4000-8000-000000000001'),1,'A review survived B delete attempt');
update public.coach_form_reviews set member_question='owner update' where id='6b100000-0000-4000-8000-000000000001';
select is((select member_question from public.coach_form_reviews where id='6b100000-0000-4000-8000-000000000001'),'owner update','A can update own review');

reset role;
set local role anon;
select is_empty($$select id from public.coach_form_reviews$$,'anonymous users read no reviews');
select ok(not has_table_privilege('anon','public.coach_form_reviews','select'),'anonymous role has no table grant');

reset role;
select is((select public from storage.buckets where id='coach-form-videos'),false,'video bucket is private');
select is((select file_size_limit::bigint from storage.buckets where id='coach-form-videos'),52428800::bigint,'bucket enforces 50 MB');
select is((select count(*)::int from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'form videos owner%'),3,'storage has owner-scoped policies');

select * from finish();
rollback;
