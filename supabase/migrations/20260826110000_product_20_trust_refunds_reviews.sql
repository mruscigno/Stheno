create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_charge_id text not null,
  stripe_refund_id text,
  first_paid_at timestamptz not null,
  reason text,
  eligibility text not null check (eligibility in ('eligible','ineligible')),
  status text not null check (status in ('processing','refunded','rejected','failed')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_code text,
  unique (stripe_charge_id)
);
create index if not exists refund_requests_user_time_idx on public.refund_requests(user_id, requested_at desc);
alter table public.refund_requests enable row level security;
revoke all on public.refund_requests from anon;
grant select, insert on public.refund_requests to authenticated;
create policy "refund_requests_select_own" on public.refund_requests for select to authenticated using ((select auth.uid()) = user_id);
create policy "refund_requests_insert_own" on public.refund_requests for insert to authenticated with check ((select auth.uid()) = user_id);

create table if not exists public.review_provider_configs (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null unique,
  profile_url text not null,
  rating numeric(3,2),
  review_count integer not null default 0 check (review_count >= 0),
  badge_config jsonb not null default '{}',
  is_active boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.review_provider_configs enable row level security;
revoke all on public.review_provider_configs from anon, authenticated;

create table if not exists public.review_prompt_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_name text not null,
  milestone text not null,
  action text not null check (action in ('shown','clicked','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists review_prompt_events_user_time_idx on public.review_prompt_events(user_id, created_at desc);
alter table public.review_prompt_events enable row level security;
revoke all on public.review_prompt_events from anon;
grant select, insert on public.review_prompt_events to authenticated;
create policy "review_prompt_events_select_own" on public.review_prompt_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "review_prompt_events_insert_own" on public.review_prompt_events for insert to authenticated with check ((select auth.uid()) = user_id);

create table if not exists public.public_profile_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_url text,
  display_name text,
  consented_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  check (consented_at is null or revoked_at is null or revoked_at >= consented_at)
);
alter table public.public_profile_consents enable row level security;
revoke all on public.public_profile_consents from anon;
grant select, insert, update, delete on public.public_profile_consents to authenticated;
create policy "public_profile_consents_select_own" on public.public_profile_consents for select to authenticated using ((select auth.uid()) = user_id);
create policy "public_profile_consents_insert_own" on public.public_profile_consents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "public_profile_consents_update_own" on public.public_profile_consents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "public_profile_consents_delete_own" on public.public_profile_consents for delete to authenticated using ((select auth.uid()) = user_id);
