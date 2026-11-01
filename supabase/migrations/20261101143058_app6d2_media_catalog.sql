-- App 6D-2: additive, reversible catalog for reviewed purchased media.
-- This migration is intentionally not applied to production while migration
-- history is divergent. New links default inactive and are never preferred
-- until every review state is approved.

create table if not exists public.exercise_media_assets (
  id text primary key check (id ~ '^sha256:[0-9a-f]{64}:[a-z0-9_-]+$'),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  source_collection text not null,
  source_entry text not null,
  original_mime text not null,
  original_bytes bigint not null check (original_bytes > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds > 0),
  frame_count integer check (frame_count is null or frame_count > 0),
  codec text,
  duplicate_group text,
  license_reference text not null,
  rights jsonb not null default '{}'::jsonb,
  review_state text not null default 'pending' check (review_state in ('pending','approved','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sha256, source_collection)
);

create table if not exists public.exercise_media_derivatives (
  id uuid primary key default gen_random_uuid(),
  asset_id text not null references public.exercise_media_assets(id) on delete restrict,
  kind text not null check (kind in ('video_mp4','video_webm','poster_webp','gif_fallback')),
  storage_key text not null unique,
  mime_type text not null,
  bytes bigint not null check (bytes > 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds > 0),
  codec text,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  conversion jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (asset_id, kind, sha256)
);

create table if not exists public.exercise_media_links (
  id uuid primary key default gen_random_uuid(),
  asset_id text not null references public.exercise_media_assets(id) on delete restrict,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  derivative_id uuid references public.exercise_media_derivatives(id) on delete restrict,
  poster_derivative_id uuid references public.exercise_media_derivatives(id) on delete restrict,
  media_role text not null check (media_role in ('primary_demo','technique_tip','alternate_angle','comparison')),
  segment_start_seconds numeric check (segment_start_seconds is null or segment_start_seconds >= 0),
  segment_end_seconds numeric,
  precedence smallint not null default 50 check (precedence between 1 and 100),
  mapping_review_state text not null default 'pending' check (mapping_review_state in ('pending','approved','rejected')),
  technical_review_state text not null default 'pending' check (technical_review_state in ('pending','approved','rejected')),
  editorial_review_state text not null default 'pending' check (editorial_review_state in ('pending','approved','rejected')),
  reviewer_reference text,
  reviewed_at timestamptz,
  review_notes text,
  feature_flag text not null default 'exercise_media_6d2',
  active boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (segment_end_seconds is null or segment_start_seconds is null or segment_end_seconds > segment_start_seconds),
  unique (asset_id, exercise_id, media_role, version)
);

create table if not exists public.exercise_media_review_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.exercise_media_links(id) on delete cascade,
  reviewer_reference text not null,
  review_type text not null check (review_type in ('mapping','technical','editorial_safety','quality')),
  decision text not null check (decision in ('approved','rejected','changes_requested')),
  notes text not null,
  evidence_reference text,
  created_at timestamptz not null default now()
);

create index if not exists exercise_media_links_active_exercise_idx
  on public.exercise_media_links (exercise_id, precedence, media_role)
  where active;
create index if not exists exercise_media_derivatives_asset_idx
  on public.exercise_media_derivatives (asset_id, kind)
  where approved;

alter table public.exercise_media_assets enable row level security;
alter table public.exercise_media_derivatives enable row level security;
alter table public.exercise_media_links enable row level security;
alter table public.exercise_media_review_events enable row level security;

revoke all on public.exercise_media_assets from anon, authenticated;
revoke all on public.exercise_media_review_events from anon, authenticated;
revoke all on public.exercise_media_derivatives from anon, authenticated;
revoke all on public.exercise_media_links from anon, authenticated;
grant select on public.exercise_media_derivatives to anon, authenticated;
grant select on public.exercise_media_links to anon, authenticated;

drop policy if exists "read approved exercise media derivatives" on public.exercise_media_derivatives;
create policy "read approved exercise media derivatives"
  on public.exercise_media_derivatives for select to anon, authenticated
  using (approved);

drop policy if exists "read active reviewed exercise media links" on public.exercise_media_links;
create policy "read active reviewed exercise media links"
  on public.exercise_media_links for select to anon, authenticated
  using (
    active
    and mapping_review_state = 'approved'
    and technical_review_state = 'approved'
    and editorial_review_state = 'approved'
  );

comment on table public.exercise_media_assets is 'Private immutable provenance for App 6D-2 purchased media; never exposed to client roles.';
comment on table public.exercise_media_links is 'Flag-disabled reviewed media links. Existing exercise_media and provider mappings remain fallback.';
