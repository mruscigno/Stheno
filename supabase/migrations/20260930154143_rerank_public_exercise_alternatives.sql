-- Re-rank the complete reviewed public substitution graph using the same
-- hierarchy as the runtime training engine: training purpose, movement
-- pattern, primary target, family/equipment compatibility, then stable slug.
-- PostgreSQL validates the unique key row-by-row during an UPDATE, so remove
-- and restore it around the atomic set-based rerank to avoid transient swaps.
alter table public.exercise_alternatives
  drop constraint exercise_alternatives_exercise_id_rank_key;

with catalog as (
  select e.*,
    case
      when e.movement_pattern='hinge' or e.family ~ '(rdl|deadlift|hinge|hip_extension|good_morning)' then 'hip_hinge'
      when e.movement_pattern='horizontal_pull' or e.family ~ '(row|scapular_retraction|rear_delt_row)' then 'horizontal_row'
      when e.movement_pattern='vertical_pull' or e.family ~ '(pull_up|chin_up|pulldown|vertical_pull)' then 'vertical_pull'
      when e.movement_pattern='squat' or e.family ~ '(squat|knee_extension)' then 'squat'
      when e.movement_pattern='lunge' or e.family ~ '(lunge|step_up|split_squat)' then 'single_leg_knee_dominant'
      when e.movement_pattern='horizontal_push' or e.family ~ '(bench_press|chest_press|push_up|incline_press)' then 'horizontal_press'
      when e.movement_pattern='vertical_push' or e.family ~ '(overhead_press|landmine_press|pike_press|push_press)' then 'vertical_press'
      when e.movement_pattern='carry' or e.family like '%carry%' then 'loaded_carry'
      else e.family
    end as training_purpose
  from public.exercises e
  where e.status='production' and e.production_ready is true
), scored as (
  select ea.exercise_id,ea.alternative_id,
    (case when original.training_purpose=alternative.training_purpose then 100 else 0 end
     + case when original.movement_pattern=alternative.movement_pattern then 40 else 0 end
     + 20 * cardinality(array(select unnest(original.primary_muscles) intersect select unnest(alternative.primary_muscles)))::numeric
          / greatest(1,cardinality(original.primary_muscles))
     + case when original.family=alternative.family then 10 else 0 end
     + 8 * cardinality(array(select unnest(original.required_equipment) intersect select unnest(alternative.required_equipment)))::numeric
          / greatest(1,cardinality(alternative.required_equipment))
    ) as score,
    original.training_purpose=alternative.training_purpose as purpose_preserved,
    original.movement_pattern=alternative.movement_pattern as pattern_preserved,
    alternative.slug as alternative_slug
  from public.exercise_alternatives ea
  join catalog original on original.id=ea.exercise_id
  join catalog alternative on alternative.id=ea.alternative_id
  where ea.review_status='reviewed'
), ranked as (
  select scored.*,
    row_number() over(partition by exercise_id order by score desc,alternative_slug)::smallint as new_rank
  from scored
)
update public.exercise_alternatives ea
set rank=ranked.new_rank,
    relevance_score=ranked.score,
    relevance_factors=jsonb_build_object(
      'training_purpose_preserved',ranked.purpose_preserved,
      'movement_pattern_preserved',ranked.pattern_preserved,
      'ranking_version','purpose_pattern_target_equipment_v2'
    )
from ranked
where ea.exercise_id=ranked.exercise_id and ea.alternative_id=ranked.alternative_id;

alter table public.exercise_alternatives
  add constraint exercise_alternatives_exercise_id_rank_key unique(exercise_id,rank);
