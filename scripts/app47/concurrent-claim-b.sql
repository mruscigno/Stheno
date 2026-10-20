\set ON_ERROR_STOP on
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b4777777-2222-4222-8222-222222222222","role":"authenticated"}', true);
select public.claim_anonymous_assessment(
  'c4777777-3333-4333-8333-333333333333', repeat('c',64),
  'b4777777-2222-4222-8222-222222222222', '{"goal":"strength"}', '{}', 'normal',
  '{"name":"Concurrent loser"}', '{"valid":true}', current_date,
  'app47', 'app47', 'app47'
);
commit;

