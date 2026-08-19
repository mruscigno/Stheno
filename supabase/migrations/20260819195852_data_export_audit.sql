create table public.data_export_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('requested','completed','failed')),
  record_count integer check (record_count is null or record_count >= 0),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index data_export_events_owner_time_idx on public.data_export_events(user_id, requested_at desc);
alter table public.data_export_events enable row level security;
create policy "data export owner select" on public.data_export_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "data export owner insert" on public.data_export_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "data export owner update" on public.data_export_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.data_export_events to authenticated;
