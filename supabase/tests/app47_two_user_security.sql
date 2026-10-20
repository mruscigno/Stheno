begin;

select plan(23);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('a1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'app47-user-a@example.test', '', now(), now(), now()),
  ('b2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'app47-user-b@example.test', '', now(), now(), now());

-- The production-equivalent auth trigger creates the matching profile rows.
update public.profiles set display_name = 'App47 User A'
where user_id = 'a1111111-1111-4111-8111-111111111111';
update public.profiles set display_name = 'App47 User B'
where user_id = 'b2222222-2222-4222-8222-222222222222';

insert into public.programs (id, user_id, name, engine_version, ruleset_version)
values
  ('a1000000-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111111', 'A program', 'app47', 'app47'),
  ('b2000000-0000-4000-8000-000000000002', 'b2222222-2222-4222-8222-222222222222', 'B program', 'app47', 'app47');

insert into public.workout_sessions (id, user_id, started_at, time_zone)
values
  ('a1000000-0000-4000-8000-000000000011', 'a1111111-1111-4111-8111-111111111111', now(), 'UTC'),
  ('b2000000-0000-4000-8000-000000000012', 'b2222222-2222-4222-8222-222222222222', now(), 'UTC');

insert into public.monthly_reviews (id, user_id, period_start, period_end, due_at, status)
values
  ('a1000000-0000-4000-8000-000000000021', 'a1111111-1111-4111-8111-111111111111', current_date - 27, current_date, now(), 'due'),
  ('b2000000-0000-4000-8000-000000000022', 'b2222222-2222-4222-8222-222222222222', current_date - 27, current_date, now(), 'due');

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do update set public = excluded.public;

insert into storage.objects (id, bucket_id, name, owner_id, metadata)
values
  ('a1000000-0000-4000-8000-000000000031', 'progress-photos', 'a1111111-1111-4111-8111-111111111111/front.jpg', 'a1111111-1111-4111-8111-111111111111', '{"mimetype":"image/jpeg"}'),
  ('b2000000-0000-4000-8000-000000000032', 'progress-photos', 'b2222222-2222-4222-8222-222222222222/front.jpg', 'b2222222-2222-4222-8222-222222222222', '{"mimetype":"image/jpeg"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select results_eq($$select user_id from public.profiles order by user_id$$,
  $$values ('a1111111-1111-4111-8111-111111111111'::uuid)$$,
  'A reads only A profile');
select results_eq($$select user_id from public.programs order by user_id$$,
  $$values ('a1111111-1111-4111-8111-111111111111'::uuid)$$,
  'A reads only A program');
select results_eq($$select user_id from public.workout_sessions order by user_id$$,
  $$values ('a1111111-1111-4111-8111-111111111111'::uuid)$$,
  'A reads only A workouts');
select results_eq($$select user_id from public.monthly_reviews order by user_id$$,
  $$values ('a1111111-1111-4111-8111-111111111111'::uuid)$$,
  'A reads only A monthly reviews');
select is_empty($$select user_id from public.profiles where user_id = 'b2222222-2222-4222-8222-222222222222'$$,
  'A cannot read B profile by swapped id');
select is_empty($$update public.programs set name = 'tampered' where user_id = 'b2222222-2222-4222-8222-222222222222' returning id$$,
  'A cannot update B program');
select is_empty($$delete from public.workout_sessions where user_id = 'b2222222-2222-4222-8222-222222222222' returning id$$,
  'A cannot delete B workout');
select results_eq($$select name from storage.objects where bucket_id = 'progress-photos' order by name$$,
  $$values ('a1111111-1111-4111-8111-111111111111/front.jpg'::text)$$,
  'A cannot read B private progress-photo object');

select set_config('request.jwt.claims', '{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select results_eq($$select user_id from public.profiles order by user_id$$,
  $$values ('b2222222-2222-4222-8222-222222222222'::uuid)$$,
  'B reads only B profile');
select is_empty($$select id from public.programs where user_id = 'a1111111-1111-4111-8111-111111111111'$$,
  'B cannot read A program');
select is_empty($$select name from storage.objects where bucket_id = 'progress-photos' and name like 'a111%'$$,
  'B cannot read A private progress-photo object');

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select public.claim_anonymous_assessment(
  'c3000000-0000-4000-8000-000000000001','bad','a1111111-1111-4111-8111-111111111111',
  '{}'::jsonb,'{}'::jsonb,'normal','{}'::jsonb,'{}'::jsonb,current_date,'app47','app47','app47')$$,
  '42501', null, 'anonymous callers cannot invoke claim RPC');

reset role;
insert into public.anonymous_assessment_sessions (
  id, capability_hash, schema_version, state, revision, answers, blueprint,
  blueprint_version, expires_at, finalized_at
) values
  ('c3000000-0000-4000-8000-000000000001', repeat('a',64), 'initial-v1', 'finalized', 1,
   '{"goal":"strength"}', '{"summary":"synthetic"}', 'app47', now() + interval '1 day', now()),
  ('c3000000-0000-4000-8000-000000000002', repeat('b',64), 'initial-v1', 'finalized', 1,
   '{"goal":"mobility"}', '{"summary":"synthetic"}', 'app47', now() - interval '1 minute', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select throws_ok($$select public.claim_anonymous_assessment(
  'c3000000-0000-4000-8000-000000000001',repeat('f',64),'a1111111-1111-4111-8111-111111111111',
  '{}'::jsonb,'{}'::jsonb,'normal','{}'::jsonb,'{}'::jsonb,current_date,'app47','app47','app47')$$,
  '42501', 'invalid_capability', 'tampered capability is denied');
select throws_ok($$select public.claim_anonymous_assessment(
  'c3000000-0000-4000-8000-000000000002',repeat('b',64),'a1111111-1111-4111-8111-111111111111',
  '{}'::jsonb,'{}'::jsonb,'normal','{}'::jsonb,'{}'::jsonb,current_date,'app47','app47','app47')$$,
  '22023', 'session_expired', 'expired capability is denied');
select throws_ok($$select public.claim_anonymous_assessment(
  'c3000000-0000-4000-8000-000000000001',repeat('a',64),'b2222222-2222-4222-8222-222222222222',
  '{}'::jsonb,'{}'::jsonb,'normal','{}'::jsonb,'{}'::jsonb,current_date,'app47','app47','app47')$$,
  '42501', 'claimant_identity_mismatch', 'A cannot claim for B');

select lives_ok($$select public.claim_anonymous_assessment(
  'c3000000-0000-4000-8000-000000000001',repeat('a',64),'a1111111-1111-4111-8111-111111111111',
  '{"goal":"strength"}'::jsonb,'{}'::jsonb,'normal',
  '{"name":"Claimed plan"}'::jsonb,'{"valid":true}'::jsonb,current_date,'app47','app47','app47')$$,
  'valid owner claim succeeds');
select results_eq($$select state from public.anonymous_assessment_sessions where id = 'c3000000-0000-4000-8000-000000000001'$$,
  $$values ('claimed'::text)$$, 'claim finalizes ownership');
select results_eq($$select count(*)::bigint from public.assessments where source_anonymous_session_id = 'c3000000-0000-4000-8000-000000000001'$$,
  $$values (1::bigint)$$, 'claim creates exactly one assessment');
select lives_ok($$select public.claim_anonymous_assessment(
  'c3000000-0000-4000-8000-000000000001',repeat('a',64),'a1111111-1111-4111-8111-111111111111',
  '{"goal":"strength"}'::jsonb,'{}'::jsonb,'normal',
  '{"name":"Claimed plan"}'::jsonb,'{"valid":true}'::jsonb,current_date,'app47','app47','app47')$$,
  'same owner retry is idempotent');
select results_eq($$select count(*)::bigint from public.assessments where source_anonymous_session_id = 'c3000000-0000-4000-8000-000000000001'$$,
  $$values (1::bigint)$$, 'idempotent retry creates no duplicate assessment');

select throws_ok($$insert into public.entitlements (user_id, entitlement_key, active)
  values ('a1111111-1111-4111-8111-111111111111','paid',true)$$,
  '42501', null, 'client cannot grant itself entitlement');
select is_empty($$select id from public.api_idempotency_records where user_id = 'b2222222-2222-4222-8222-222222222222'$$,
  'A cannot read B idempotency receipts');

reset role;
select set_config('request.jwt.claims', '{}', true);
set local role anon;
select is_empty($$select user_id from public.profiles$$, 'anonymous caller sees no private profiles');
select is_empty($$select id from public.programs$$, 'anonymous caller sees no private programs');

select * from finish();
rollback;

