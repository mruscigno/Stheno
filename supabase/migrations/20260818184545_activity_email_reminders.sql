create table public.activity_email_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null,
  event_type text not null check (event_type in ('workout','checkin','progress')),
  event_key text not null,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  unique (user_id,event_date,event_type,event_key)
);
create index activity_email_reminders_owner_date_idx on public.activity_email_reminders(user_id,event_date desc);
alter table public.activity_email_reminders enable row level security;
grant select,insert,update on public.activity_email_reminders to service_role;
