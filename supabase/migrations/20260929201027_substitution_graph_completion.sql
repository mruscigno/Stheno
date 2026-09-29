alter table public.exercise_alternatives
  add column if not exists relevance_score numeric,
  add column if not exists relevance_factors jsonb not null default '{}'::jsonb;

with sources as (
  select e.* from public.exercises e
  where e.status='production' and not exists(select 1 from public.exercise_alternatives a where a.exercise_id=e.id)
), ranked as (
  select s.id exercise_id,c.id alternative_id,
    45*(s.movement_pattern=c.movement_pattern)::int
    +25*(s.exercise_role=c.exercise_role)::int
    +20.0*(select count(*) from unnest(s.primary_muscles) m where m=any(c.primary_muscles))/greatest(cardinality(s.primary_muscles),1)
    +7.0*(select count(*) from unnest(s.required_equipment) q where q=any(c.required_equipment))/greatest(cardinality(s.required_equipment),1)
    +3*greatest(0,1-abs(coalesce(s.fatigue_cost,3)-coalesce(c.fatigue_cost,3))/4.0) score,
    array(select m from unnest(s.primary_muscles) m where m=any(c.primary_muscles)) shared,
    row_number() over(partition by s.id order by
      (s.movement_pattern=c.movement_pattern) desc,
      (s.exercise_role=c.exercise_role) desc,
      (select count(*) from unnest(s.primary_muscles) m where m=any(c.primary_muscles)) desc,
      (select count(*) from unnest(s.required_equipment) q where q=any(c.required_equipment)) desc,
      abs(coalesce(s.fatigue_cost,3)-coalesce(c.fatigue_cost,3)),c.slug) rank
  from sources s join public.exercises c on c.status='production' and c.id<>s.id
  where s.movement_pattern=c.movement_pattern
    and exists(select 1 from unnest(s.primary_muscles) m where m=any(c.primary_muscles))
)
insert into public.exercise_alternatives(exercise_id,alternative_id,rank,shared_primary_muscles,review_status,relevance_score,relevance_factors)
select exercise_id,alternative_id,rank,shared,'reviewed',round(score,2),jsonb_build_object('same_pattern',true,'shared_primary_muscles',shared,'model_version','purpose-pattern-muscle-equipment-difficulty-v1')
from ranked where rank<=3
on conflict(exercise_id,alternative_id) do update set rank=excluded.rank,shared_primary_muscles=excluded.shared_primary_muscles,review_status=excluded.review_status,relevance_score=excluded.relevance_score,relevance_factors=excluded.relevance_factors;

update public.exercises e set substitutions_validated=exists(
  select 1 from public.exercise_alternatives a where a.exercise_id=e.id and a.review_status='reviewed'
) where e.status='production';

update public.exercises set quality_validated_at=quality_validated_at where status='production';
