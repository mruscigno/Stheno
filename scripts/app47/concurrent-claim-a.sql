\set ON_ERROR_STOP on
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a4777777-1111-4111-8111-111111111111","role":"authenticated"}', true);
select public.claim_anonymous_assessment(
  'c4777777-3333-4333-8333-333333333333', repeat('c',64),
  'a4777777-1111-4111-8111-111111111111', '{"goal":"strength"}', '{}', 'normal',
  '{"name":"Concurrent winner"}', '{"valid":true}', current_date,
  'app47', 'app47', 'app47'
);
select pg_sleep(3);
commit;

