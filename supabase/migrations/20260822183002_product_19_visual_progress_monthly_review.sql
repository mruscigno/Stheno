create table public.member_review_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  program_started_at timestamptz not null,
  next_monthly_review_at timestamptz not null,
  last_monthly_review_at timestamptz,
  monthly_review_due boolean not null default false,
  monthly_review_status text not null default 'scheduled' check (monthly_review_status in ('scheduled','due','started','completed')),
  reminder_sent_at timestamptz,
  follow_up_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  due_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'due' check (status in ('due','started','completed')),
  prior_review_id uuid references public.monthly_reviews(id) on delete set null,
  intake jsonb not null default '{}'::jsonb,
  structured_assessment jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, due_at)
);
create index monthly_reviews_owner_due_idx on public.monthly_reviews(user_id,due_at desc);

create table public.monthly_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_review_id uuid not null references public.monthly_reviews(id) on delete cascade,
  type text not null,
  scope text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  reason_codes text[] not null default '{}',
  plain_language_reason text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  decided_at timestamptz,
  unique (monthly_review_id,type,scope)
);
create index monthly_recommendations_review_idx on public.monthly_recommendations(monthly_review_id);

create table public.progress_photo_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_review_id uuid references public.monthly_reviews(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  baseline boolean not null default false,
  captured_at timestamptz not null default now(),
  views text[] not null default '{}',
  consent_version text not null,
  consented_at timestamptz not null,
  completed_at timestamptz,
  check (views <@ array['front','left','back','right']::text[])
);
create index progress_photo_sets_owner_time_idx on public.progress_photo_sets(user_id,captured_at desc);

create table public.progress_photo_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_set_id uuid not null references public.progress_photo_sets(id) on delete cascade,
  view text not null check (view in ('front','left','back','right')),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (photo_set_id,view)
);

create table public.visual_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_set_id uuid not null references public.progress_photo_sets(id) on delete cascade,
  comparison_photo_set_id uuid references public.progress_photo_sets(id) on delete set null,
  structured_observations jsonb not null,
  confidence text not null check (confidence in ('clear','unclear','insufficient')),
  analysis_version text not null,
  created_at timestamptz not null default now()
);

create table public.fitness_memory_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  memory jsonb not null,
  created_at timestamptz not null default now()
);
create index fitness_memory_owner_time_idx on public.fitness_memory_entries(user_id,created_at desc);

do $$ declare t text; begin
  foreach t in array array['member_review_state','monthly_reviews','monthly_recommendations','progress_photo_sets','progress_photo_views','visual_observations','fitness_memory_entries'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t||'_select_own',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t||'_insert_own',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t||'_update_own',t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t||'_delete_own',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('progress-photos','progress-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "progress photos owner select" on storage.objects for select to authenticated
using (bucket_id='progress-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "progress photos owner insert" on storage.objects for insert to authenticated
with check (bucket_id='progress-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and storage.extension(name) in ('jpg','jpeg','png','webp'));
create policy "progress photos owner update" on storage.objects for update to authenticated
using (bucket_id='progress-photos' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='progress-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "progress photos owner delete" on storage.objects for delete to authenticated
using (bucket_id='progress-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

insert into public.member_review_state(user_id,program_started_at,next_monthly_review_at)
select distinct on (user_id) user_id,prescribed_at,prescribed_at+interval '28 days'
from public.program_prescriptions order by user_id,prescribed_at asc
on conflict (user_id) do nothing;
