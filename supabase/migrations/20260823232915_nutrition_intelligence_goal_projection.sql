create table public.nutrition_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null, consumed_at timestamptz not null default now(), meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name_snapshot text not null check (char_length(food_name_snapshot) between 1 and 160), brand_snapshot text,
  serving_quantity numeric not null default 1 check (serving_quantity > 0 and serving_quantity <= 10000), serving_unit text not null default 'serving',
  calories numeric not null check (calories >= 0 and calories <= 10000), protein_g numeric not null default 0 check (protein_g between 0 and 1000),
  carbs_g numeric not null default 0 check (carbs_g between 0 and 2000), fat_g numeric not null default 0 check (fat_g between 0 and 1000), fiber_g numeric check (fiber_g between 0 and 500),
  source_type text not null check (source_type in ('search','recent','saved_meal','quick_add','copied','barcode','photo_estimate','text_estimate')),
  provider text, provider_item_id text, estimate_confidence text check (estimate_confidence in ('low','medium','high')),
  user_confirmed boolean not null default true, copied_from_entry_id uuid references public.nutrition_entries(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index nutrition_entries_owner_day_idx on public.nutrition_entries(user_id, local_date, consumed_at) where deleted_at is null;

create table public.saved_meals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 100), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.saved_meal_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 saved_meal_id uuid not null references public.saved_meals(id) on delete cascade, position smallint not null default 1,
 food_name_snapshot text not null, brand_snapshot text, serving_quantity numeric not null, serving_unit text not null,
 calories numeric not null, protein_g numeric not null default 0, carbs_g numeric not null default 0, fat_g numeric not null default 0, fiber_g numeric,
 provider text, provider_item_id text, created_at timestamptz not null default now()
);
create index saved_meal_items_meal_idx on public.saved_meal_items(saved_meal_id, position);

create table public.nutrition_daily_summaries (
 user_id uuid not null references auth.users(id) on delete cascade, local_date date not null,
 calories numeric not null default 0, protein_g numeric not null default 0, carbs_g numeric not null default 0, fat_g numeric not null default 0, fiber_g numeric not null default 0,
 logging_status text not null default 'none' check (logging_status in ('none','partial','complete')),
 target_id uuid references public.nutrition_targets(id) on delete set null, updated_at timestamptz not null default now(), primary key(user_id, local_date)
);
create index nutrition_daily_summaries_owner_day_idx on public.nutrition_daily_summaries(user_id, local_date desc);

create table public.goal_projection_snapshots (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 generated_at timestamptz not null default now(), horizon_weeks smallint not null check (horizon_weeks in (8,12)),
 current_weight numeric, projected_weight_low numeric, projected_weight_high numeric, observed_weekly_rate numeric,
 target_weekly_rate_low numeric, target_weekly_rate_high numeric,
 state text not null check (state in ('NOT_ENOUGH_DATA','ON_TRACK','FASTER_THAN_TARGET','SLOWER_THAN_TARGET','PLATEAU_POSSIBLE','RECENT_CHANGE_WAIT')),
 confidence text not null check (confidence in ('none','low','medium','high')), algorithm_version text not null,
 evidence_snapshot jsonb not null default '{}'::jsonb
);
create index goal_projection_snapshots_owner_time_idx on public.goal_projection_snapshots(user_id, generated_at desc);

do $$ declare t text; begin
 foreach t in array array['nutrition_entries','saved_meals','saved_meal_items','nutrition_daily_summaries','goal_projection_snapshots'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t||'_select_own', t);
  execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t||'_insert_own', t);
  execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t||'_update_own', t);
  execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t||'_delete_own', t);
  execute format('grant select, insert, update, delete on public.%I to authenticated', t);
 end loop;
end $$;
