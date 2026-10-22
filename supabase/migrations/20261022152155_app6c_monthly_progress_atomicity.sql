-- App 6C extends the Product 19 source of truth; it does not create a second
-- monthly-review or progress-photo model.
alter table public.monthly_reviews
  add column if not exists revision integer not null default 0 check (revision >= 0),
  add column if not exists updated_at timestamptz not null default now();

alter table public.progress_photo_sets
  add column if not exists consent_scope text not null default 'progress_review_only'
    check (consent_scope = 'progress_review_only'),
  add column if not exists status text not null default 'draft'
    check (status in ('draft','complete'));

update public.progress_photo_sets set status = 'complete' where completed_at is not null;

create table if not exists public.monthly_review_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_review_id uuid not null references public.monthly_reviews(id) on delete cascade,
  operation_id uuid not null,
  action text not null check (action in ('apply','keep')),
  accepted_ids uuid[] not null default '{}',
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, monthly_review_id),
  unique (user_id, operation_id)
);
alter table public.monthly_review_decisions enable row level security;
revoke all on table public.monthly_review_decisions from anon;
grant select on table public.monthly_review_decisions to authenticated;
create policy "monthly_review_decisions_select_own" on public.monthly_review_decisions
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.apply_monthly_review_decision(
  p_review_id uuid, p_operation_id uuid, p_action text, p_accepted_ids uuid[] default '{}'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_existing jsonb;
  v_row public.monthly_recommendations%rowtype;
  v_accepted uuid[] := '{}';
  v_declined uuid[] := '{}';
  v_now timestamptz := now();
  v_current public.nutrition_targets%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_action not in ('apply','keep') then raise exception 'INVALID_ACTION'; end if;
  if not exists(select 1 from public.monthly_reviews where id=p_review_id and user_id=v_user) then raise exception 'NOT_FOUND'; end if;
  select result into v_existing from public.monthly_review_decisions where user_id=v_user and monthly_review_id=p_review_id;
  if v_existing is not null then return v_existing || jsonb_build_object('replayed',true); end if;
  if p_action='apply' and exists(select 1 from unnest(p_accepted_ids) x where not exists(select 1 from public.monthly_recommendations r where r.id=x and r.monthly_review_id=p_review_id and r.user_id=v_user)) then raise exception 'RECOMMENDATION_NOT_FOUND'; end if;

  for v_row in select * from public.monthly_recommendations where monthly_review_id=p_review_id and user_id=v_user order by id for update loop
    if p_action='apply' and v_row.id=any(p_accepted_ids) then
      if v_row.type not in ('calorie_change','deload_recovery','maintain_plan') then raise exception 'INVALID_RECOMMENDATION'; end if;
      if v_row.type='calorie_change' and ((v_row.after_state->>'calories')::numeric < 1400 or (v_row.after_state->>'calories')::numeric > 6000) then raise exception 'INVALID_RECOMMENDATION'; end if;
      update public.monthly_recommendations set status='accepted',decided_at=v_now where id=v_row.id;
      v_accepted:=array_append(v_accepted,v_row.id);
      if v_row.type='calorie_change' then
        select * into v_current from public.nutrition_targets where user_id=v_user and effective_to is null order by effective_from desc limit 1 for update;
        if found then
          update public.nutrition_targets set effective_to=v_now::date where id=v_current.id;
          insert into public.nutrition_targets(user_id,calories_kcal,protein_g,carbohydrate_g,fat_g,fiber_g,hydration_ml,target_range,effective_from,effective_to,reason_code,engine_version,ruleset_version)
          values(v_user,(v_row.after_state->>'calories')::integer,v_current.protein_g,v_current.carbohydrate_g,v_current.fat_g,v_current.fiber_g,v_current.hydration_ml,v_current.target_range,v_now::date,null,'MONTHLY_REVIEW_ACCEPTED','1.0.0','2026.08');
        end if;
      end if;
      insert into public.coach_decisions(user_id,decision_type,reason_code,prior_state,new_state,structured_inputs,scope,source,confirmation_required,confirmation_status,engine_version,ruleset_version)
      values(v_user,v_row.scope,coalesce(v_row.reason_codes[1],'MONTHLY_REVIEW_ACCEPTED'),v_row.before_state,v_row.after_state,jsonb_build_object('monthly_review_id',p_review_id,'recommendation_id',v_row.id),'current_program','monthly_review',true,'committed','1.0.0','2026.08');
      insert into public.fitness_memory_entries(user_id,source_type,source_id,memory) values(v_user,'monthly_recommendation',v_row.id,jsonb_build_object('type',v_row.type,'status','accepted','after_state',v_row.after_state));
    else
      update public.monthly_recommendations set status='declined',decided_at=v_now where id=v_row.id;
      v_declined:=array_append(v_declined,v_row.id);
    end if;
  end loop;
  v_existing:=jsonb_build_object('accepted',v_accepted,'declined',v_declined,'replayed',false,'acknowledgedAt',v_now);
  insert into public.monthly_review_decisions(user_id,monthly_review_id,operation_id,action,accepted_ids,result) values(v_user,p_review_id,p_operation_id,p_action,p_accepted_ids,v_existing);
  return v_existing;
end $$;
revoke all on function public.apply_monthly_review_decision(uuid,uuid,text,uuid[]) from public, anon;
grant execute on function public.apply_monthly_review_decision(uuid,uuid,text,uuid[]) to authenticated;
