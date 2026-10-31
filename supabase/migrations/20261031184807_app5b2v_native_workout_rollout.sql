create table public.feature_rollout_controls (
  feature_key text primary key,
  state text not null check (state in ('DISABLED','INTERNAL_TEST','LIMITED_PILOT','PUBLIC')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create unique index if not exists entitlements_user_key_unique_idx
  on public.entitlements(user_id,entitlement_key);

create table public.feature_rollout_members (
  feature_key text not null references public.feature_rollout_controls(feature_key) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort text not null check (cohort in ('internal_test','limited_pilot')),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (feature_key,user_id)
);

insert into public.feature_rollout_controls(feature_key,state)
values ('native_workout','DISABLED');

create index feature_rollout_members_active_idx
  on public.feature_rollout_members(feature_key,cohort,user_id)
  where active;

alter table public.feature_rollout_controls enable row level security;
alter table public.feature_rollout_members enable row level security;

create policy "Authenticated users can read rollout state"
  on public.feature_rollout_controls for select
  to authenticated
  using (true);

create policy "Members can read their own rollout membership"
  on public.feature_rollout_members for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.feature_rollout_controls from anon,authenticated;
revoke all on public.feature_rollout_members from anon,authenticated;
grant select on public.feature_rollout_controls to authenticated;
grant select on public.feature_rollout_members to authenticated;
grant all on public.feature_rollout_controls to service_role;
grant all on public.feature_rollout_members to service_role;
