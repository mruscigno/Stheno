alter table public.programs add column program_start_date date;

update public.programs p
set program_start_date = coalesce(
  (select min(s.completed_at)::date from public.program_prescriptions pp join public.workout_execution_sessions s on s.user_id=pp.user_id where pp.program_id=p.id and s.completed_at is not null),
  p.prescribed_at::date
)
where p.program_start_date is null;

alter table public.programs alter column program_start_date set not null;
comment on column public.programs.program_start_date is 'Member-selected calendar date that anchors Program Day 1 and its rolling seven-day weeks.';

update public.member_review_state state
set program_started_at=p.program_start_date::timestamp at time zone 'UTC',next_monthly_review_at=(p.program_start_date+28)::timestamp at time zone 'UTC',updated_at=now()
from (select distinct on(user_id) user_id,program_start_date from public.programs where retired_at is null order by user_id,prescribed_at desc) p
where state.user_id=p.user_id and not exists(select 1 from public.monthly_reviews mr where mr.user_id=state.user_id and mr.status='completed');

insert into public.assessment_versions(version,status,published_at,definition,definition_hash)
values('acquisition-v2','active',now(),'{"key":"initial","version":"4.0.0","programStartDate":true}'::jsonb,'acquisition-v2-4.0.0')
on conflict(version) do update set status='active',published_at=excluded.published_at,definition=excluded.definition,definition_hash=excluded.definition_hash;
