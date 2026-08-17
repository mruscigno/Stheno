alter table public.assessment_versions
  add column definition jsonb not null default '{}'::jsonb,
  add column definition_hash text,
  add column retired_at timestamptz;

alter table public.assessments
  add column current_step_key text,
  add column updated_at timestamptz not null default now(),
  add column derivation_version text;

alter table public.assessment_responses
  add column response_value jsonb,
  add column question_version text not null default '1',
  add column answered_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

create index assessment_responses_owner_idx on public.assessment_responses(user_id);
create index assessment_responses_assessment_idx on public.assessment_responses(assessment_id);

create table public.assessment_context_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  entry_type text not null check (entry_type in ('free_form','clinician_restriction','pain_context','accessibility')),
  content text not null check (char_length(content) between 1 and 5000),
  authored_at timestamptz not null default now()
);
create index assessment_context_entries_owner_idx on public.assessment_context_entries(user_id);
create index assessment_context_entries_assessment_idx on public.assessment_context_entries(assessment_id);

create table public.interpreted_context_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  source_entry_id uuid not null references public.assessment_context_entries(id) on delete cascade,
  candidate_type text not null,
  normalized_value jsonb not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  temporal_scope text not null check (temporal_scope in ('one_time','date_range','current_program','persistent','unknown')),
  safety_flag boolean not null default false,
  confirmation_required boolean not null default true,
  confirmation_state text not null default 'pending' check (confirmation_state in ('pending','confirmed','edited','removed')),
  confirmed_value jsonb,
  interpreter_version text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index interpreted_context_candidates_owner_idx on public.interpreted_context_candidates(user_id);
create index interpreted_context_candidates_assessment_idx on public.interpreted_context_candidates(assessment_id);

create table public.safety_screening_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  source_response_id uuid references public.assessment_responses(id) on delete set null,
  source_context_entry_id uuid references public.assessment_context_entries(id) on delete set null,
  classification public.safety_classification not null,
  reason_codes text[] not null default '{}',
  screening_version text not null,
  screened_at timestamptz not null default now()
);
create index safety_screening_results_owner_idx on public.safety_screening_results(user_id);
create index safety_screening_results_assessment_idx on public.safety_screening_results(assessment_id);

create table public.personalization_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  profile_version text not null,
  profile jsonb not null,
  provenance jsonb not null default '[]'::jsonb,
  safety_classification public.safety_classification not null,
  created_at timestamptz not null default now(),
  supersedes_snapshot_id uuid references public.personalization_profile_snapshots(id)
);
create index personalization_profile_snapshots_owner_time_idx on public.personalization_profile_snapshots(user_id,created_at desc);

do $$
declare t text;
begin
  foreach t in array array['assessment_context_entries','interpreted_context_candidates','safety_screening_results','personalization_profile_snapshots'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t||'_select_own',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t||'_insert_own',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t||'_update_own',t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t||'_delete_own',t);
  end loop;
end $$;

grant select on public.assessment_versions to authenticated;
grant select,insert,update,delete on public.assessments,public.assessment_responses,public.assessment_context_entries,public.interpreted_context_candidates,public.safety_screening_results,public.personalization_profile_snapshots to authenticated;

insert into public.assessment_versions(version,status,published_at,definition,definition_hash)
values ('initial-v1','active',now(),'{"key":"initial","version":"1"}'::jsonb,'initial-v1')
on conflict (version) do update set status='active',published_at=excluded.published_at,definition=excluded.definition,definition_hash=excluded.definition_hash;
