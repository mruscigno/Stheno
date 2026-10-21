begin;
select plan(12);

select has_column('public','coach_form_reviews','consent_revoked_at','consent revocation is recorded');
select has_column('public','coach_form_reviews','cleanup_lease_token','cleanup lease token exists');
select has_column('public','coach_form_reviews','cleanup_lease_expires_at','cleanup lease expiry exists');
select has_column('public','coach_form_reviews','cleanup_attempt_count','cleanup attempts are durable');
select has_column('public','coach_form_reviews','cleanup_next_attempt_at','cleanup retry time exists');
select has_column('public','coach_form_reviews','cleanup_failure_reason','cleanup failure is observable');
select ok(not has_function_privilege('authenticated','public.claim_expired_form_reviews(integer,integer,timestamptz)','execute'),'member cannot claim retention work');
select ok(not has_function_privilege('anon','public.claim_expired_form_reviews(integer,integer,timestamptz)','execute'),'anonymous visitor cannot claim retention work');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values ('6b333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','app6b3@example.test','',now(),now(),now());
insert into public.coach_form_reviews(id,user_id,exercise_id,exercise_slug,object_path,consent_version,consented_at,camera_view,byte_size,media_type,rubric_version,idempotency_key,upload_expires_at,retention_delete_at)
select '6b300000-0000-4000-8000-000000000001','6b333333-3333-4333-8333-333333333333',id,slug,'6b333333-3333-4333-8333-333333333333/6b300000-0000-4000-8000-000000000001/set.mp4','2026.10-app6b.1',now()-interval '31 days','side',1000,'video/mp4','2026.10.1','app6b3-retention-a',now()-interval '30 days',now()-interval '1 day' from public.exercises where slug='goblet-squat';

select is((select count(*)::int from public.claim_expired_form_reviews(10,300,now())),1,'accelerated clock claims the expired review');
select isnt((select cleanup_lease_token from public.coach_form_reviews where id='6b300000-0000-4000-8000-000000000001'),null::uuid,'claimed cleanup has a lease token');
select is_empty($$select id from public.claim_expired_form_reviews(10,300,now())$$,'active lease prevents a duplicate cleanup claim');
update public.coach_form_reviews set processing_status='deleted',upload_status='deleted',structured_result=null,member_question=null,consent_revoked_at=now(),deleted_at=now(),cleanup_lease_token=null,cleanup_lease_expires_at=null where id='6b300000-0000-4000-8000-000000000001';
select is_empty($$select id from public.claim_expired_form_reviews(10,300,now()+interval '1 day')$$,'deleted review cannot be reclaimed');

select * from finish();
rollback;
