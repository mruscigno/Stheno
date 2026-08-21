create table if not exists public.social_assets (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null unique check (request_hash ~ '^[a-f0-9]{64}$'),
  content_type text not null check (content_type in ('article')),
  content_id text not null,
  article_version text not null,
  platform text not null check (platform in ('instagram_post','instagram_story','x','linkedin','facebook','square')),
  template_id text not null check (template_id in ('editorial-hero','bold-headline','key-takeaway','fitness-split','story-cover')),
  configuration jsonb not null,
  storage_path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  generated_at timestamptz not null default now()
);

create index if not exists social_assets_content_version_idx on public.social_assets(content_type,content_id,article_version);
alter table public.social_assets enable row level security;
revoke all on table public.social_assets from anon, authenticated;
comment on table public.social_assets is 'Server-managed deterministic social asset cache. Draft content is never exposed through the Data API.';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('social-assets','social-assets',true,10485760,array['image/png'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
