-- Product: STHENO Performance Intelligence & Adaptive Training
-- Additive only. Raw workout data remains the source of truth.

alter table public.workout_set_logs
  drop constraint if exists workout_set_logs_set_type_check;
alter table public.workout_set_logs
  add constraint workout_set_logs_set_type_check
  check (set_type in ('warmup','working','backoff','drop','failure','optional'));

alter table public.workout_set_logs
  add column if not exists prescribed_load numeric check (prescribed_load >= 0),
  add column if not exists prescribed_reps_min smallint check (prescribed_reps_min between 0 and 500),
  add column if not exists prescribed_reps_max smallint check (prescribed_reps_max between 0 and 500),
  add column if not exists prescribed_rest_seconds smallint check (prescribed_rest_seconds between 0 and 1800),
  add column if not exists rpe numeric check (rpe between 1 and 10),
  add column if not exists is_user_added boolean not null default false,
  add column if not exists client_performed_at timestamptz,
  add column if not exists invalidated_at timestamptz;

alter table public.workout_execution_sessions
  add column if not exists duration_seconds integer check (duration_seconds >= 0),
  add column if not exists session_effort text check (session_effort in ('too_easy','about_right','very_hard','couldnt_finish')),
  add column if not exists readiness_context jsonb not null default '{}'::jsonb,
  add column if not exists completion_notes text check (char_length(completion_notes) <= 2000),
  add column if not exists completion_summary jsonb,
  add column if not exists completion_summary_version text;

create table if not exists public.training_load_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_prescription_id uuid references public.program_prescriptions(id) on delete set null,
  workout_execution_session_id uuid references public.workout_execution_sessions(id) on delete set null,
  exercise_slug text not null,
  set_ordinal smallint check (set_ordinal between 1 and 20),
  recommended_load numeric check (recommended_load >= 0),
  load_unit text check (load_unit in ('lb','kg')),
  recommended_reps_min smallint check (recommended_reps_min between 0 and 500),
  recommended_reps_max smallint check (recommended_reps_max between 0 and 500),
  confidence text not null check (confidence in ('high','medium','low')),
  reason_code text not null,
  algorithm_version text not null,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  performed_set_id uuid references public.workout_set_logs(id) on delete set null
);
create index if not exists training_load_recommendations_owner_exercise_idx
  on public.training_load_recommendations(user_id, exercise_slug, created_at desc);
create index if not exists training_load_recommendations_session_idx
  on public.training_load_recommendations(workout_execution_session_id, exercise_slug, set_ordinal);
create unique index if not exists training_load_recommendations_active_target_idx
  on public.training_load_recommendations(user_id, workout_execution_session_id, exercise_slug, set_ordinal, algorithm_version);

alter table public.workout_set_logs
  add column if not exists recommendation_id uuid references public.training_load_recommendations(id) on delete set null;
create index if not exists workout_set_logs_recommendation_idx on public.workout_set_logs(recommendation_id);

create table if not exists public.exercise_performance_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_slug text not null,
  workout_execution_session_id uuid not null references public.workout_execution_sessions(id) on delete cascade,
  source_set_id uuid not null references public.workout_set_logs(id) on delete cascade,
  estimated_1rm numeric,
  e1rm_formula text,
  e1rm_version text,
  set_volume numeric,
  volume_scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_set_id, e1rm_version)
);
create index if not exists exercise_performance_metrics_owner_exercise_idx
  on public.exercise_performance_metrics(user_id, exercise_slug, created_at desc);
create index if not exists exercise_performance_metrics_session_idx
  on public.exercise_performance_metrics(workout_execution_session_id);

alter table public.personal_records
  drop constraint if exists personal_records_record_type_check;
alter table public.personal_records
  add constraint personal_records_record_type_check
  check (record_type in ('load','reps_at_load','estimated_1rm','exercise_volume'));
alter table public.personal_records
  add column if not exists source_set_id uuid references public.workout_set_logs(id) on delete set null,
  add column if not exists secondary_value numeric,
  add column if not exists unit text check (unit in ('lb','kg')),
  add column if not exists algorithm_version text,
  add column if not exists status text not null default 'active' check (status in ('active','superseded','invalidated')),
  add column if not exists superseded_by uuid references public.personal_records(id) on delete set null;
update public.personal_records set algorithm_version = coalesce(algorithm_version, engine_version) where algorithm_version is null;
create unique index if not exists personal_records_source_type_version_idx
  on public.personal_records(user_id, exercise_slug, record_type, source_set_id, algorithm_version);
create index if not exists personal_records_active_owner_idx
  on public.personal_records(user_id, exercise_slug, record_type, achieved_at desc)
  where status = 'active';

create table if not exists public.muscle_workload_weekly (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  muscle_group text not null,
  planned_set_equivalents numeric not null default 0 check (planned_set_equivalents >= 0),
  completed_set_equivalents numeric not null default 0 check (completed_set_equivalents >= 0),
  algorithm_version text not null,
  updated_at timestamptz not null default now(),
  primary key(user_id, period_start, muscle_group, algorithm_version)
);
create index if not exists muscle_workload_owner_period_idx
  on public.muscle_workload_weekly(user_id, period_start desc);

create table if not exists public.training_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_type text not null,
  source_session_id uuid references public.workout_execution_sessions(id) on delete set null,
  achieved_at timestamptz not null default now(),
  context jsonb not null default '{}'::jsonb,
  algorithm_version text not null,
  unique(user_id, achievement_type, source_session_id, algorithm_version)
);
create index if not exists training_achievements_owner_time_idx
  on public.training_achievements(user_id, achieved_at desc);

alter table public.user_preferences
  add column if not exists effort_input_mode text not null default 'simple' check (effort_input_mode in ('simple','rir','rpe')),
  add column if not exists rest_timer_sound boolean not null default false,
  add column if not exists rest_timer_haptics boolean not null default false,
  add column if not exists show_advanced_metrics boolean not null default false;

do $$
declare t text;
begin
  foreach t in array array['training_load_recommendations','exercise_performance_metrics','muscle_workload_weekly','training_achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end $$;

grant select, insert, update on public.workout_execution_sessions, public.workout_set_logs, public.personal_records to authenticated;
