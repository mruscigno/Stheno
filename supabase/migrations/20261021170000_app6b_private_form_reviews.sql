-- App 6B private exercise-form review foundation. Public processing remains feature-gated off.
create table public.coach_form_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.coach_conversations(id) on delete set null,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  exercise_slug text not null,
  object_path text not null unique,
  consent_version text not null,
  consented_at timestamptz not null,
  camera_view text not null check (camera_view in ('front','side','rear','unknown')),
  member_question text,
  duration_seconds numeric,
  byte_size bigint,
  media_type text,
  upload_status text not null default 'pending' check (upload_status in ('pending','uploaded','validated','rejected','deleted')),
  processing_status text not null default 'uploading' check (processing_status in ('uploading','queued','processing','completed','abstained','failed','deleted')),
  rubric_version text not null,
  provider text,
  provider_version text,
  structured_result jsonb,
  failure_reason text,
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  usage_units integer not null default 0 check (usage_units >= 0),
  estimated_cost_usd numeric(10,6) not null default 0 check (estimated_cost_usd >= 0),
  idempotency_key text not null,
  upload_expires_at timestamptz not null,
  retention_delete_at timestamptz not null,
  claimed_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index coach_form_reviews_owner_created_idx on public.coach_form_reviews(user_id, created_at desc);
create index coach_form_reviews_queue_idx on public.coach_form_reviews(processing_status, created_at) where processing_status in ('queued','processing');

alter table public.coach_form_reviews enable row level security;
create policy coach_form_reviews_select_own on public.coach_form_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy coach_form_reviews_insert_own on public.coach_form_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy coach_form_reviews_update_own on public.coach_form_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy coach_form_reviews_delete_own on public.coach_form_reviews for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.coach_form_reviews to authenticated;
revoke all on public.coach_form_reviews from anon;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('coach-form-videos','coach-form-videos',false,52428800,array['video/mp4','video/quicktime'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "form videos owner select" on storage.objects for select to authenticated
using (bucket_id='coach-form-videos' and owner_id=(select auth.uid())::text and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "form videos owner insert" on storage.objects for insert to authenticated
with check (bucket_id='coach-form-videos' and (storage.foldername(name))[1]=(select auth.uid())::text and storage.extension(name) in ('mp4','mov'));
create policy "form videos owner delete" on storage.objects for delete to authenticated
using (bucket_id='coach-form-videos' and owner_id=(select auth.uid())::text and (storage.foldername(name))[1]=(select auth.uid())::text);
