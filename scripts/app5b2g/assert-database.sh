#!/usr/bin/env bash
set -euo pipefail
: "${STHENO_E2E_EMAIL:?STHENO_E2E_EMAIL is required}"
: "${POSTGRES_URL:?POSTGRES_URL is required}"
evidence_root="${STHENO_E2E_EVIDENCE%/android}"
mkdir -p "$evidence_root/database"
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -c \
  'do $$ begin if not exists(select 1 from public.assessment_versions where version='"'"'4.0.0'"'"' and status='"'"'active'"'"') then raise exception '"'"'assessment_version_contract_failed'"'"'; end if; end $$;'
echo "assessment_version_contract=passed"
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -v email="$STHENO_E2E_EMAIL" -At <<'SQL' | tee "$evidence_root/database/assertions.txt"
select set_config('app.e2e_email', :'email', false);
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = current_setting('app.e2e_email');
  if uid is null then raise exception 'test user missing'; end if;
  if (select count(*) from public.anonymous_assessment_sessions where claimed_by=uid and state='claimed') <> 1 then raise exception 'expected exactly one claimed anonymous assessment'; end if;
  if (select count(*) from public.assessments where user_id=uid) <> 1 then raise exception 'expected exactly one assessment'; end if;
  if (select count(*) from public.program_prescriptions where user_id=uid) <> 1 then raise exception 'expected exactly one program prescription'; end if;
  if (select count(*) from public.workout_execution_sessions where user_id=uid) <> 1 then raise exception 'expected exactly one replay-safe workout session'; end if;
  if (select count(*) from public.workout_set_logs where user_id=uid and state='completed' and deleted_at is null) <> 1 then raise exception 'expected exactly one reconciled workout set'; end if;
  if (select count(*) from public.workout_operation_receipts where user_id=uid and operation_kind='upsert_set') <> 1 then raise exception 'expected exactly one set receipt'; end if;
end $$;
select 'isolated_native_journey=passed';
SQL

