create policy program_prescriptions_update_own on public.program_prescriptions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant update on public.program_prescriptions to authenticated;

create table public.exercise_replacement_preferences (
 user_id uuid not null references auth.users(id) on delete cascade,
 original_slug text not null,
 replacement_slug text not null,
 reason text not null,
 updated_at timestamptz not null default now(),
 primary key(user_id,original_slug)
);

alter table public.exercise_replacement_preferences enable row level security;
create policy exercise_replacement_preferences_select_own on public.exercise_replacement_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy exercise_replacement_preferences_insert_own on public.exercise_replacement_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy exercise_replacement_preferences_update_own on public.exercise_replacement_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy exercise_replacement_preferences_delete_own on public.exercise_replacement_preferences for delete to authenticated using ((select auth.uid()) = user_id);
grant select,insert,update,delete on public.exercise_replacement_preferences to authenticated;
