create table public.assessment_response_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_key text not null,
  response_value jsonb,
  question_version text not null,
  recorded_at timestamptz not null default now()
);
create index assessment_response_revisions_owner_idx on public.assessment_response_revisions(user_id);
create index assessment_response_revisions_assessment_idx on public.assessment_response_revisions(assessment_id,recorded_at desc);
alter table public.assessment_response_revisions enable row level security;
create policy assessment_response_revisions_select_own on public.assessment_response_revisions for select to authenticated using ((select auth.uid()) = user_id);
create policy assessment_response_revisions_insert_own on public.assessment_response_revisions for insert to authenticated with check ((select auth.uid()) = user_id);
grant select,insert on public.assessment_response_revisions to authenticated;
