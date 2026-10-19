create table public.api_idempotency_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (char_length(scope) between 1 and 120),
  operation_id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  response_body jsonb not null,
  status_code integer not null check (status_code between 200 and 599),
  resource_revision bigint not null default 1 check (resource_revision > 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  unique (user_id, scope, operation_id)
);

create index api_idempotency_records_expiry_idx
  on public.api_idempotency_records (expires_at);

alter table public.api_idempotency_records enable row level security;

create policy "api idempotency records select own"
  on public.api_idempotency_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "api idempotency records insert own"
  on public.api_idempotency_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.api_idempotency_records to authenticated;

comment on table public.api_idempotency_records is
  'Durable replay receipts for versioned API mutations. Rows may be removed after expires_at once no supported client can retry them.';
