create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('terms','privacy','medical_disclaimer')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  source_context text not null,
  unique (user_id, document_type, document_version)
);

alter table public.legal_acceptances enable row level security;
grant select on public.legal_acceptances to authenticated;
create policy "users read own legal acceptances" on public.legal_acceptances
  for select to authenticated using ((select auth.uid()) = user_id);
create index legal_acceptances_user_time_idx on public.legal_acceptances(user_id,accepted_at desc);

alter table public.exercises
  add column if not exists prescribable boolean not null default false,
  add column if not exists public_indexable boolean not null default false,
  add column if not exists purpose text,
  add column if not exists media_provenance jsonb not null default '{}'::jsonb,
  add column if not exists technical_review_status text not null default 'pending' check (technical_review_status in ('pending','reviewed','rejected')),
  add column if not exists editorial_review_status text not null default 'pending' check (editorial_review_status in ('pending','reviewed','rejected')),
  add column if not exists visual_review_status text not null default 'pending' check (visual_review_status in ('pending','reviewed','rejected'));

update public.exercises
set purpose = coalesce(purpose, 'Build controlled strength and skill in the listed primary muscles.'),
    media_provenance = jsonb_build_object(
      'movement_visual', 'STHENO_ORIGINAL_SCHEMATIC',
      'anatomy_visual', 'STHENO_ORIGINAL_ANATOMY_MAP',
      'pipeline', 'offline_reviewed',
      'version', coalesce(content_version,'1.0.0')
    )
where status = 'production';

-- Product 15 reviewed launch batch: the original 20 currently prescribed movements.
-- Remaining catalog items stay non-prescribable/non-indexable until batch review.
update public.exercises
set prescribable = true,
    public_indexable = true,
    technical_review_status = 'reviewed',
    editorial_review_status = 'reviewed',
    visual_review_status = 'reviewed'
where slug = any(array[
  'barbell-back-squat','goblet-squat','leg-press','split-squat','barbell-rdl',
  'dumbbell-rdl','hip-thrust','leg-curl','barbell-bench-press','dumbbell-bench-press',
  'push-up','dumbbell-overhead-press','cable-row','one-arm-dumbbell-row','lat-pulldown',
  'pull-up','lateral-raise','dumbbell-curl','cable-triceps-pressdown','standing-calf-raise'
]);

create or replace view public.exercise_readiness_coverage
with (security_invoker = true) as
select
  count(*) filter (where prescribable and public_indexable) as complete,
  count(*) filter (where jsonb_array_length(coalesce(education->'setup','[]'::jsonb)) < 1
                    or jsonb_array_length(coalesce(education->'execution','[]'::jsonb)) < 1) as missing_instructions,
  count(*) filter (where visual_review_status <> 'reviewed') as missing_visual,
  count(*) filter (where not (media_provenance ? 'anatomy_visual')) as missing_anatomy,
  count(*) filter (where technical_review_status <> 'reviewed'
                    or editorial_review_status <> 'reviewed'
                    or visual_review_status <> 'reviewed') as review_pending,
  count(*) as total
from public.exercises;

revoke all on public.exercise_readiness_coverage from anon, authenticated;
