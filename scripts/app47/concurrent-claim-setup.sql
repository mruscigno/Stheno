\set ON_ERROR_STOP on

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('a4777777-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'app47-race-a@example.test', '', now(), now(), now()),
  ('b4777777-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'app47-race-b@example.test', '', now(), now(), now());

insert into public.anonymous_assessment_sessions (
  id, capability_hash, schema_version, state, revision, answers, blueprint,
  blueprint_version, expires_at, finalized_at
) values (
  'c4777777-3333-4333-8333-333333333333', repeat('c', 64), 'initial-v1',
  'finalized', 1, '{"goal":"strength"}', '{"summary":"concurrent fixture"}',
  'app47', now() + interval '1 day', now()
);

