alter table public.profiles add column if not exists is_test_user boolean not null default false;

alter table public.social_funnel_events
  add column if not exists route text,
  add column if not exists app_version text,
  add column if not exists deployment_timestamp timestamptz,
  add column if not exists bot_signal boolean not null default false;

create index if not exists social_funnel_events_event_created_idx
  on public.social_funnel_events(event_name, created_at desc);
create index if not exists social_funnel_events_version_created_idx
  on public.social_funnel_events(app_version, created_at desc);

comment on column public.profiles.is_test_user is 'Private operational designation used to exclude QA accounts from customer analytics.';
comment on column public.social_funnel_events.bot_signal is 'Conservative user-agent signal for investigation only; events are not automatically excluded.';
