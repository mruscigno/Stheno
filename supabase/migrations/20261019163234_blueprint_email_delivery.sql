create table if not exists public.blueprint_email_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  marketing_consent boolean not null default false,
  marketing_consented_at timestamptz,
  consent_language_version text,
  consent_source text,
  anonymous_session_id text,
  attribution_source text,
  attribution_medium text,
  attribution_campaign text,
  first_requested_at timestamptz not null default now(),
  last_requested_at timestamptz not null default now(),
  last_delivered_at timestamptz,
  last_delivery_status text not null default 'pending'
    check (last_delivery_status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  delivery_count integer not null default 0 check (delivery_count >= 0),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_normalized)
);

comment on table public.blueprint_email_leads is
  'Transactional Blueprint delivery records and separately granted marketing consent. Assessment answers are intentionally excluded.';

alter table public.blueprint_email_leads enable row level security;
revoke all on table public.blueprint_email_leads from anon, authenticated;
grant select, insert, update on table public.blueprint_email_leads to service_role;
