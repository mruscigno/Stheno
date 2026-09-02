alter table public.profiles add column if not exists is_internal boolean not null default false;

update public.profiles p
set is_internal = true, updated_at = now()
from auth.users u
where p.user_id = u.id and lower(u.email) = 'matthewruscigno@gmail.com';

create table if not exists public.social_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  anonymous_session_id text,
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'direct',
  medium text,
  campaign text,
  content text,
  landing_variant text not null default 'default',
  device text not null default 'unknown',
  browser text not null default 'unknown',
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists social_funnel_events_created_idx on public.social_funnel_events(created_at desc);
create index if not exists social_funnel_events_source_created_idx on public.social_funnel_events(source, created_at desc);
create index if not exists social_funnel_events_session_idx on public.social_funnel_events(anonymous_session_id, created_at);
create index if not exists social_funnel_events_user_idx on public.social_funnel_events(user_id, created_at);

alter table public.social_funnel_events enable row level security;
revoke all on table public.social_funnel_events from anon, authenticated;

comment on table public.social_funnel_events is 'Private, server-written acquisition funnel events. Assessment answers and health free text are prohibited.';
comment on column public.profiles.is_internal is 'Private operational designation used to exclude founders and test accounts from customer analytics.';
