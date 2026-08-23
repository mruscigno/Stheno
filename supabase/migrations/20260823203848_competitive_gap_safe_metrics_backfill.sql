-- Safe, idempotent backfill. Subjective effort and historical prescriptions are intentionally not invented.
insert into public.exercise_performance_metrics(user_id,exercise_slug,workout_execution_session_id,source_set_id,estimated_1rm,e1rm_formula,e1rm_version,set_volume,volume_scope,created_at,updated_at)
select user_id,exercise_slug,workout_execution_session_id,id,
  load_value*(1+repetitions::numeric/30),
  'epley','epley_v1',load_value*repetitions,'within_exercise',performed_at,now()
from public.workout_set_logs
where state='completed' and set_type<>'warmup' and load_value>0 and repetitions between 1 and 12
on conflict(source_set_id,e1rm_version) do update
set estimated_1rm=excluded.estimated_1rm,set_volume=excluded.set_volume,updated_at=now();
