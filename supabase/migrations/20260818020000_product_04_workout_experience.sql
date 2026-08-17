create table public.workout_execution_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, program_prescription_id uuid not null references public.program_prescriptions(id) on delete restrict, workout_key text not null, status text not null check(status in ('active','paused','completed','abandoned','stale')), original_workout jsonb not null, revised_workout jsonb, current_exercise_index smallint not null default 0, started_at timestamptz not null default now(), paused_at timestamptz, completed_at timestamptz, updated_at timestamptz not null default now(), client_session_key uuid not null, unique(user_id,client_session_key)
);
create index workout_execution_sessions_owner_status_idx on public.workout_execution_sessions(user_id,status,updated_at desc);
create index workout_execution_sessions_prescription_idx on public.workout_execution_sessions(program_prescription_id);

create table public.workout_set_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, workout_execution_session_id uuid not null references public.workout_execution_sessions(id) on delete cascade, exercise_slug text not null, set_ordinal smallint not null check(set_ordinal between 1 and 20), set_type text not null default 'working' check(set_type in ('warmup','working','backoff')), prescribed jsonb not null, load_value numeric check(load_value >= 0), load_unit text not null default 'lb' check(load_unit in ('lb','kg')), repetitions smallint check(repetitions between 0 and 200), rir numeric check(rir between 0 and 10), state text not null check(state in ('completed','skipped')), performed_at timestamptz not null default now(), idempotency_key uuid not null, updated_at timestamptz not null default now(), unique(user_id,idempotency_key), unique(workout_execution_session_id,exercise_slug,set_ordinal)
);
create index workout_set_logs_owner_time_idx on public.workout_set_logs(user_id,performed_at desc);
create index workout_set_logs_session_idx on public.workout_set_logs(workout_execution_session_id);
create index workout_set_logs_exercise_history_idx on public.workout_set_logs(user_id,exercise_slug,performed_at desc);

create table public.workout_session_adaptations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, workout_execution_session_id uuid not null references public.workout_execution_sessions(id) on delete cascade, adaptation_type text not null check(adaptation_type in ('exercise_replacement','time_constraint','equipment_constraint','reorder')), reason text not null, scope text check(scope in ('session_only','program','persistent')), original_state jsonb not null, revised_state jsonb not null, reason_codes text[] not null, safety_classification public.safety_classification not null default 'normal', engine_version text not null, ruleset_version text not null, applied_at timestamptz not null default now()
);
create index workout_session_adaptations_owner_idx on public.workout_session_adaptations(user_id,applied_at desc);
create index workout_session_adaptations_session_idx on public.workout_session_adaptations(workout_execution_session_id);

create table public.personal_records (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, workout_execution_session_id uuid not null references public.workout_execution_sessions(id) on delete cascade, exercise_slug text not null, record_type text not null check(record_type in ('load','reps_at_load','estimated_1rm')), value numeric not null, context jsonb not null, achieved_at timestamptz not null default now(), engine_version text not null, ruleset_version text not null, unique(user_id,exercise_slug,record_type,value)
);
create index personal_records_owner_exercise_idx on public.personal_records(user_id,exercise_slug,achieved_at desc);
create index personal_records_session_idx on public.personal_records(workout_execution_session_id);

do $$ declare t text; begin foreach t in array array['workout_execution_sessions','workout_set_logs','workout_session_adaptations','personal_records'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t||'_select_own',t);
 execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t||'_insert_own',t);
 execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t||'_update_own',t);
end loop;end $$;
grant select,insert,update on public.workout_execution_sessions,public.workout_set_logs,public.workout_session_adaptations,public.personal_records to authenticated;
