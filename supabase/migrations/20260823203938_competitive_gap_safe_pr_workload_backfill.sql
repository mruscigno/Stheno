-- Safe PR history from immutable objective set data. Units are normalized to lb for comparisons.
with valid as (
  select l.*,
    case when l.load_unit='kg' then l.load_value*2.2046226218 else l.load_value end as normalized_load,
    case when l.load_unit='kg' then l.load_value*2.2046226218*(1+l.repetitions::numeric/30) else l.load_value*(1+l.repetitions::numeric/30) end as normalized_e1rm,
    l.load_value*l.repetitions as set_volume
  from public.workout_set_logs l
  where l.state='completed' and l.set_type<>'warmup' and l.load_value>0 and l.repetitions between 1 and 12
), ranked as (
  select valid.*,
    max(normalized_load) over(partition by user_id,exercise_slug order by performed_at,id rows between unbounded preceding and 1 preceding) as prior_load,
    max(repetitions) over(partition by user_id,exercise_slug,normalized_load order by performed_at,id rows between unbounded preceding and 1 preceding) as prior_reps,
    max(normalized_e1rm) over(partition by user_id,exercise_slug order by performed_at,id rows between unbounded preceding and 1 preceding) as prior_e1rm,
    max(set_volume) over(partition by user_id,exercise_slug,load_unit order by performed_at,id rows between unbounded preceding and 1 preceding) as prior_volume
  from valid
), candidates as (
  select *, 'load'::text as record_type,load_value as record_value,repetitions::numeric as secondary from ranked where prior_load is null or normalized_load>prior_load
  union all select *, 'reps_at_load',repetitions::numeric,load_value from ranked where prior_reps is null or repetitions>prior_reps
  union all select *, 'estimated_1rm',normalized_e1rm,null::numeric from ranked where prior_e1rm is null or normalized_e1rm>prior_e1rm
  union all select *, 'exercise_volume',set_volume,null::numeric from ranked where prior_volume is null or set_volume>prior_volume
)
insert into public.personal_records(user_id,workout_execution_session_id,exercise_slug,record_type,value,secondary_value,unit,source_set_id,context,achieved_at,engine_version,ruleset_version,algorithm_version,status)
select user_id,workout_execution_session_id,exercise_slug,record_type,record_value,secondary,load_unit,id,
  jsonb_build_object('load',load_value,'reps',repetitions,'set_type',set_type,'backfilled',true),performed_at,'pr_v1','pr_v1','pr_v1','active'
from candidates
on conflict do nothing;

-- Recompute planned and completed set-equivalents from existing workout prescriptions and performed working sets.
with planned as (
  select s.user_id,date_trunc('week',coalesce(s.completed_at,s.started_at))::date as period_start,
    ex.slug,(item->>'sets')::numeric as set_count
  from public.workout_execution_sessions s
  cross join lateral jsonb_array_elements(s.original_workout->'exercises') item
  join public.exercises ex on ex.slug=item->>'exerciseSlug'
  where s.status='completed'
), planned_muscles as (
  select user_id,period_start,muscle,sum(set_count*weight) planned_sets from planned p
  join public.exercises ex on ex.slug=p.slug
  cross join lateral (
    select unnest(ex.primary_muscles) muscle,1.0::numeric weight
    union all select unnest(ex.secondary_muscles),0.5::numeric
  ) mapping group by user_id,period_start,muscle
), completed_muscles as (
  select l.user_id,date_trunc('week',coalesce(s.completed_at,l.performed_at))::date as period_start,muscle,sum(weight) completed_sets
  from public.workout_set_logs l
  join public.workout_execution_sessions s on s.id=l.workout_execution_session_id
  join public.exercises ex on ex.slug=l.exercise_slug
  cross join lateral (
    select unnest(ex.primary_muscles) muscle,1.0::numeric weight
    union all select unnest(ex.secondary_muscles),0.5::numeric
  ) mapping
  where l.state='completed' and l.set_type<>'warmup' and l.invalidated_at is null
  group by l.user_id,date_trunc('week',coalesce(s.completed_at,l.performed_at))::date,muscle
), totals as (
  select coalesce(p.user_id,c.user_id) user_id,coalesce(p.period_start,c.period_start) period_start,coalesce(p.muscle,c.muscle) muscle,
    coalesce(p.planned_sets,0) planned_sets,coalesce(c.completed_sets,0) completed_sets
  from planned_muscles p full join completed_muscles c using(user_id,period_start,muscle)
)
insert into public.muscle_workload_weekly(user_id,period_start,muscle_group,planned_set_equivalents,completed_set_equivalents,algorithm_version,updated_at)
select user_id,period_start,muscle,planned_sets,completed_sets,'set_equivalent_v1',now() from totals
on conflict(user_id,period_start,muscle_group,algorithm_version) do update
set planned_set_equivalents=excluded.planned_set_equivalents,completed_set_equivalents=excluded.completed_set_equivalents,updated_at=now();
