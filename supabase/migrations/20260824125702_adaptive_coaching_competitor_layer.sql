alter table public.user_preferences add column if not exists guided_workout_mode boolean not null default false;
alter table public.user_preferences add column if not exists recovery_prompts_enabled boolean not null default true;

create table if not exists public.training_blocks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  program_prescription_id uuid not null references public.program_prescriptions(id) on delete cascade,
  block_index integer not null check (block_index > 0), name text not null, focus text not null,
  duration_weeks integer not null check (duration_weeks between 1 and 24), current_week integer not null default 1 check (current_week > 0),
  phase text not null check (phase in ('foundation','build','progress','intensify','recovery','consolidate')),
  status text not null default 'active' check (status in ('active','completed')), previous_block_id uuid references public.training_blocks(id),
  algorithm_version text not null, reason_codes text[] not null default '{}', started_at timestamptz not null default now(), completed_at timestamptz,
  unique(program_prescription_id, block_index)
);
create index if not exists training_blocks_user_status_idx on public.training_blocks(user_id,status,started_at desc);

create table if not exists public.training_block_priorities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  block_id uuid not null references public.training_blocks(id) on delete cascade, priority text not null,
  created_at timestamptz not null default now(), unique(block_id)
);
create table if not exists public.training_block_summaries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  block_id uuid not null unique references public.training_blocks(id) on delete cascade,
  valid_metrics jsonb not null default '{}', learned_facts jsonb not null default '{}', next_block_proposal jsonb not null default '{}',
  reason_codes text[] not null default '{}', algorithm_version text not null, created_at timestamptz not null default now()
);
create table if not exists public.recovery_observations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_execution_session_id uuid references public.workout_execution_sessions(id) on delete set null,
  muscle_group text, response text not null check (response in ('fully_recovered','little_sore','very_sore','not_sure')),
  scope text not null default 'today' check (scope in ('today','plan')), created_at timestamptz not null default now()
);
create index if not exists recovery_observations_user_created_idx on public.recovery_observations(user_id,created_at desc);

create table if not exists public.adaptive_coaching_decisions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  decision_type text not null, source_session_id uuid references public.workout_execution_sessions(id) on delete set null,
  source_block_id uuid references public.training_blocks(id) on delete set null, scope text not null default 'today' check (scope in ('today','plan')),
  status text not null default 'proposed' check (status in ('proposed','applied','dismissed')),
  reason_codes text[] not null default '{}', evidence_snapshot jsonb not null default '{}', original_state jsonb not null default '{}', proposed_state jsonb not null default '{}',
  algorithm_version text not null, idempotency_key text not null unique, created_at timestamptz not null default now(), applied_at timestamptz
);
create index if not exists adaptive_coaching_decisions_user_created_idx on public.adaptive_coaching_decisions(user_id,created_at desc);
create table if not exists public.schedule_repair_decisions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, action text not null check (action in ('move','continue','skip','reflow')),
  original_schedule jsonb not null, proposed_schedule jsonb not null, reason_codes text[] not null default '{}', algorithm_version text not null,
  status text not null default 'proposed' check (status in ('proposed','applied','dismissed')), idempotency_key text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.workout_coach_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_execution_session_id uuid references public.workout_execution_sessions(id) on delete cascade, source_set_id uuid references public.workout_set_logs(id) on delete set null,
  event_type text not null, facts jsonb not null default '{}', reason_code text not null, algorithm_version text not null,
  idempotency_key text not null unique, shown_at timestamptz, dismissed_at timestamptz, created_at timestamptz not null default now()
);

do $$ declare t text; begin foreach t in array array['training_blocks','training_block_priorities','training_block_summaries','recovery_observations','adaptive_coaching_decisions','schedule_repair_decisions','workout_coach_events'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from anon',t); execute format('grant select, insert, update on table public.%I to authenticated',t); end loop; end $$;

create policy "training_blocks_select_own" on public.training_blocks for select to authenticated using ((select auth.uid())=user_id);
create policy "training_blocks_insert_own" on public.training_blocks for insert to authenticated with check ((select auth.uid())=user_id);
create policy "training_blocks_update_own" on public.training_blocks for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "training_block_priorities_select_own" on public.training_block_priorities for select to authenticated using ((select auth.uid())=user_id);
create policy "training_block_priorities_insert_own" on public.training_block_priorities for insert to authenticated with check ((select auth.uid())=user_id);
create policy "training_block_priorities_update_own" on public.training_block_priorities for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "training_block_summaries_select_own" on public.training_block_summaries for select to authenticated using ((select auth.uid())=user_id);
create policy "training_block_summaries_insert_own" on public.training_block_summaries for insert to authenticated with check ((select auth.uid())=user_id);
create policy "training_block_summaries_update_own" on public.training_block_summaries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "recovery_observations_select_own" on public.recovery_observations for select to authenticated using ((select auth.uid())=user_id);
create policy "recovery_observations_insert_own" on public.recovery_observations for insert to authenticated with check ((select auth.uid())=user_id);
create policy "recovery_observations_update_own" on public.recovery_observations for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "adaptive_coaching_decisions_select_own" on public.adaptive_coaching_decisions for select to authenticated using ((select auth.uid())=user_id);
create policy "adaptive_coaching_decisions_insert_own" on public.adaptive_coaching_decisions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "adaptive_coaching_decisions_update_own" on public.adaptive_coaching_decisions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "schedule_repair_decisions_select_own" on public.schedule_repair_decisions for select to authenticated using ((select auth.uid())=user_id);
create policy "schedule_repair_decisions_insert_own" on public.schedule_repair_decisions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "schedule_repair_decisions_update_own" on public.schedule_repair_decisions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "workout_coach_events_select_own" on public.workout_coach_events for select to authenticated using ((select auth.uid())=user_id);
create policy "workout_coach_events_insert_own" on public.workout_coach_events for insert to authenticated with check ((select auth.uid())=user_id);
create policy "workout_coach_events_update_own" on public.workout_coach_events for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
