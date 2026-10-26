-- App 5B-2H: anonymous assessment sessions persist the public schema version
-- (4.0.0). The atomic claim transaction resolves that exact value to an
-- assessment_versions row, so keep the registry keyed by the same contract.
insert into public.assessment_versions(version,status,published_at,definition,definition_hash)
values(
  '4.0.0',
  'active',
  now(),
  '{"key":"acquisition-v2","version":"4.0.0","programStartDate":true}'::jsonb,
  'acquisition-v2-4.0.0'
)
on conflict(version) do update
set status=excluded.status,
    published_at=excluded.published_at,
    definition=excluded.definition,
    definition_hash=excluded.definition_hash;

