#!/usr/bin/env bash
set -euo pipefail
: "${STHENO_E2E_EMAIL:?STHENO_E2E_EMAIL is required}"
: "${POSTGRES_URL:?POSTGRES_URL is required}"
mkdir -p artifacts/app5b2g/database
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -v email="$STHENO_E2E_EMAIL" -At <<'SQL' | tee artifacts/app5b2g/database/assertions.txt
select set_config('app.e2e_email', :'email', false);
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = current_setting('app.e2e_email');
  if uid is null then raise exception 'test user missing'; end if;
  if (select count(*) from public.anonymous_assessment_sessions where claimed_by=uid and state='claimed') <> 1 then raise exception 'expected exactly one claimed anonymous assessment'; end if;
  if (select count(*) from public.assessments where user_id=uid) <> 1 then raise exception 'expected exactly one assessment'; end if;
  if (select count(*) from public.program_prescriptions where user_id=uid) <> 1 then raise exception 'expected exactly one program prescription'; end if;
end $$;
select 'isolated_native_journey=passed';
SQL

