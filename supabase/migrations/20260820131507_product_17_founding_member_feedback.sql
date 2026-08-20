create table if not exists public.founding_member_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort text not null default 'founding-01',
  feedback text not null check (char_length(feedback) between 10 and 4000),
  consistency_helped boolean,
  travel_adaptation_used boolean not null default false,
  schedule_adaptation_used boolean not null default false,
  equipment_substitution_used boolean not null default false,
  decision_fatigue_reduced boolean,
  completed_workouts integer check (completed_workouts is null or completed_workouts >= 0),
  permission_to_quote boolean not null default false,
  permission_for_case_study boolean not null default false,
  permission_for_outcome_metrics boolean not null default false,
  consent_recorded_at timestamptz,
  publication_status text not null default 'unpublished' check (publication_status in ('unpublished','approved','published','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.founding_member_feedback enable row level security;

create policy "Members can submit their own founding feedback"
on public.founding_member_feedback for insert
to authenticated
with check ((select auth.uid()) = user_id and publication_status = 'unpublished');

create policy "Members can read their own founding feedback"
on public.founding_member_feedback for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Members can update unpublished feedback and consent"
on public.founding_member_feedback for update
to authenticated
using ((select auth.uid()) = user_id and publication_status = 'unpublished')
with check ((select auth.uid()) = user_id and publication_status = 'unpublished');

grant select, insert, update on public.founding_member_feedback to authenticated;

create index if not exists founding_member_feedback_user_id_idx
on public.founding_member_feedback (user_id, created_at desc);

comment on table public.founding_member_feedback is
'Private founding-member feedback and explicit, revocable proof permissions. No row is public by default.';
