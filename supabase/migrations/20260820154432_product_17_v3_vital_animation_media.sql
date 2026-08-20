create table if not exists public.exercise_media_sources (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  media_provider text not null,
  provider_exercise_id text not null,
  provider_exercise_name text not null,
  provider_source_path text not null,
  source_archive_sha256 text,
  hosted_video_path text not null,
  hosted_poster_path text not null,
  gender_variant text not null default 'neutral',
  media_quality jsonb not null default '{}'::jsonb,
  provenance_note text not null,
  license_name text not null,
  imported_at timestamptz not null default now(),
  active boolean not null default true,
  fallback_priority smallint not null default 10 check (fallback_priority between 1 and 100),
  checksum text not null,
  unique (exercise_id, media_provider, provider_exercise_id, gender_variant),
  unique (hosted_video_path),
  unique (hosted_poster_path)
);

create index if not exists exercise_media_sources_active_exercise_idx
  on public.exercise_media_sources (exercise_id, fallback_priority)
  where active;

alter table public.exercise_media_sources enable row level security;

comment on table public.exercise_media_sources is
  'Admin-managed, deactivatable provider media mappings. STHENO exercise content remains authoritative.';

revoke all on table public.exercise_media_sources from anon, authenticated;
