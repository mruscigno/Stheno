-- Prescription semantics are deliberately separate from the broad exercise_type
-- category. This lets strength, cardio, carries and mobility render the right unit.
alter table public.exercises
  add column if not exists movement_type text,
  add column if not exists prescription_unit text,
  add column if not exists duration_min_seconds integer,
  add column if not exists duration_max_seconds integer,
  add column if not exists distance_min numeric,
  add column if not exists distance_max numeric,
  add column if not exists distance_unit text,
  add column if not exists interval_work_seconds integer,
  add column if not exists interval_recovery_seconds integer,
  add column if not exists interval_rounds_min smallint,
  add column if not exists interval_rounds_max smallint,
  add column if not exists schema_valid boolean not null default false,
  add column if not exists movement_type_valid boolean not null default false,
  add column if not exists semantic_validation_passed boolean not null default false,
  add column if not exists substitutions_validated boolean not null default false,
  add column if not exists media_validated boolean not null default false,
  add column if not exists content_reviewed boolean not null default false,
  add column if not exists quality_review_required boolean not null default true,
  add column if not exists quality_validated_at timestamptz;

alter table public.exercises drop constraint if exists exercises_movement_type_check;
alter table public.exercises add constraint exercises_movement_type_check check (movement_type in (
  'DYNAMIC_REPS','TIMED_ISOMETRIC','LOADED_CARRY_TIME','LOADED_CARRY_DISTANCE',
  'CARDIO_TIME','CARDIO_DISTANCE','CARDIO_INTERVAL','MOBILITY_REPS','MOBILITY_TIME'
));
alter table public.exercises drop constraint if exists exercises_prescription_unit_check;
alter table public.exercises add constraint exercises_prescription_unit_check check (prescription_unit in ('reps','seconds','distance','interval'));
alter table public.exercises drop constraint if exists exercises_duration_range_check;
alter table public.exercises add constraint exercises_duration_range_check check (
  duration_min_seconds is null or (duration_min_seconds > 0 and duration_max_seconds >= duration_min_seconds)
);
alter table public.exercises drop constraint if exists exercises_distance_range_check;
alter table public.exercises add constraint exercises_distance_range_check check (
  distance_min is null or (distance_min > 0 and distance_max >= distance_min and distance_unit in ('m','yd','km','mi'))
);

-- Deterministic initial classification. Ambiguous records remain visible to QA;
-- this classification never uses an LLM and does not publish new exercises.
update public.exercises set movement_type = case
  when exercise_type = 'loaded_carry' and lower(name) ~ '(march|waiter)' then 'LOADED_CARRY_TIME'
  when exercise_type = 'loaded_carry' then 'LOADED_CARRY_DISTANCE'
  when exercise_type = 'cardio' and lower(name) ~ '(sprint|hiit|interval)' then 'CARDIO_INTERVAL'
  when exercise_type = 'cardio' and lower(name) ~ '(distance|mile|5k|10k)' then 'CARDIO_DISTANCE'
  when exercise_type = 'cardio' then 'CARDIO_TIME'
  when exercise_type in ('stretching','rehabilitation') and lower(name) ~ '(stretch|pose|breath|hold|fold)' then 'MOBILITY_TIME'
  when exercise_type in ('mobility','stretching','rehabilitation','balance') then 'MOBILITY_REPS'
  when lower(name) ~ '(plank|wall sit|dead hang|static hold|isometric|hollow hold|l-sit)'
    and lower(name) !~ '(tap|dip|jack|walk|row|push|climber|to downward|one arm lift)' then 'TIMED_ISOMETRIC'
  else 'DYNAMIC_REPS'
end
where status = 'production';

update public.exercises set
  prescription_unit = case
    when movement_type in ('DYNAMIC_REPS','MOBILITY_REPS') then 'reps'
    when movement_type in ('TIMED_ISOMETRIC','LOADED_CARRY_TIME','CARDIO_TIME','MOBILITY_TIME') then 'seconds'
    when movement_type in ('LOADED_CARRY_DISTANCE','CARDIO_DISTANCE') then 'distance'
    when movement_type = 'CARDIO_INTERVAL' then 'interval'
  end,
  duration_min_seconds = case when movement_type in ('TIMED_ISOMETRIC','LOADED_CARRY_TIME','CARDIO_TIME','MOBILITY_TIME') then greatest(coalesce(rep_min, 15), 10) end,
  duration_max_seconds = case when movement_type in ('TIMED_ISOMETRIC','LOADED_CARRY_TIME','CARDIO_TIME','MOBILITY_TIME') then greatest(coalesce(rep_max, 30), coalesce(rep_min, 15), 10) end,
  distance_min = case when movement_type = 'LOADED_CARRY_DISTANCE' then greatest(coalesce(rep_min, 10), 10) when movement_type = 'CARDIO_DISTANCE' then 1 end,
  distance_max = case when movement_type = 'LOADED_CARRY_DISTANCE' then greatest(coalesce(rep_max, 20), coalesce(rep_min, 10), 10) when movement_type = 'CARDIO_DISTANCE' then 5 end,
  distance_unit = case when movement_type = 'LOADED_CARRY_DISTANCE' then 'yd' when movement_type = 'CARDIO_DISTANCE' then 'mi' end,
  interval_work_seconds = case when movement_type = 'CARDIO_INTERVAL' then 20 end,
  interval_recovery_seconds = case when movement_type = 'CARDIO_INTERVAL' then 40 end,
  interval_rounds_min = case when movement_type = 'CARDIO_INTERVAL' then 4 end,
  interval_rounds_max = case when movement_type = 'CARDIO_INTERVAL' then 10 end
where status = 'production';

-- Rep columns are no longer overloaded with seconds or distance.
update public.exercises set rep_min = null, rep_max = null
where status = 'production' and prescription_unit <> 'reps';

-- Replace rep-oriented boilerplate only where the prescription semantics prove it
-- wrong. Existing reviewed dynamic-lift copy is otherwise preserved.
update public.exercises e set education = coalesce(e.education, '{}'::jsonb) || case
  when movement_type = 'TIMED_ISOMETRIC' then jsonb_build_object(
    'setup', jsonb_build_array('Set a stable base for ' || name || ' and align your joints before taking tension.', 'Brace your trunk while keeping your neck neutral and your breathing unforced.'),
    'execution', jsonb_build_array('Build full-body tension and hold the intended position without drifting or sagging.', 'Take controlled breaths while maintaining the same joint positions.', 'End the hold when position or breathing can no longer remain controlled.'),
    'cues', jsonb_build_array('Brace before the hold begins.', 'Breathe behind the brace.', 'Finish the hold before position changes.'),
    'mistakes', jsonb_build_array('Holding the breath throughout the effort.', 'Letting the hips or shoulders drift out of position.', 'Extending the hold after control has been lost.'),
    'feel', 'Expect sustained effort through ' || array_to_string(primary_muscles, ' and ') || ' while the joints remain steady.',
    'stopModify', 'End the hold if you cannot maintain position or if you feel sharp, sudden, or worsening pain.'
  )
  when movement_type in ('LOADED_CARRY_TIME','LOADED_CARRY_DISTANCE') then jsonb_build_object(
    'setup', jsonb_build_array('Clear the walking path and place the load where it can be picked up without twisting.', 'Stand tall with the load secure, shoulders controlled, and ribs stacked over the pelvis.'),
    'execution', jsonb_build_array('Walk with short, controlled steps while keeping the load close and the torso upright.', 'Turn with several small steps instead of pivoting under load.', 'Stop fully, then lower the load with control after completing the prescribed ' || case when movement_type='LOADED_CARRY_TIME' then 'time' else 'distance' end || '.'),
    'cues', jsonb_build_array('Walk tall and quiet.', 'Keep the load controlled.', 'Use small steps to turn.'),
    'mistakes', jsonb_build_array('Leaning away from the load.', 'Rushing or crossing the feet while turning.', 'Dropping the load instead of setting it down under control.'),
    'feel', 'Expect the grip, trunk, and postural muscles to work continuously while you walk.',
    'stopModify', 'Stop if grip or posture can no longer control the load, or if you feel sharp, sudden, or worsening pain.'
  )
  when movement_type in ('CARDIO_TIME','CARDIO_DISTANCE','CARDIO_INTERVAL') then jsonb_build_object(
    'setup', jsonb_build_array('Set up the space or machine for ' || name || ' and begin at an easy pace.', 'Confirm you can control the movement and breathe comfortably before increasing intensity.'),
    'execution', jsonb_build_array('Use a repeatable rhythm and the prescribed ' || case when movement_type='CARDIO_INTERVAL' then 'work and recovery intervals' when movement_type='CARDIO_DISTANCE' then 'distance and pace' else 'duration and intensity' end || '.', 'Keep the movement controlled as fatigue builds rather than chasing speed with poor position.', 'Reduce the pace gradually at the end instead of stopping abruptly.'),
    'cues', jsonb_build_array('Start easier than your target pace.', 'Keep the rhythm repeatable.', 'Recover before technique deteriorates.'),
    'mistakes', jsonb_build_array('Starting too hard to sustain the session.', 'Letting fatigue turn the movement uncontrolled.', 'Skipping the gradual warm-up or finish.'),
    'feel', 'Expect breathing and heart rate to rise in proportion to the prescribed intensity.',
    'stopModify', 'Slow down or stop for chest pain, faintness, unusual breathlessness, or sharp, sudden, or worsening pain.'
  )
  when movement_type in ('MOBILITY_TIME','MOBILITY_REPS') then jsonb_build_object(
    'setup', jsonb_build_array('Move into the starting position for ' || name || ' without forcing range.', 'Use support when needed so balance does not limit the intended motion.'),
    'execution', jsonb_build_array(case when movement_type='MOBILITY_TIME' then 'Ease into the position and hold only a comfortable range while breathing steadily.' else 'Move slowly through a comfortable range and pause briefly at the controlled end position.' end, 'Keep the rest of the body quiet enough to direct motion to the intended area.', case when movement_type='MOBILITY_TIME' then 'Come out of the position gradually when the prescribed time ends.' else 'Return smoothly to the start before the next controlled repetition.' end),
    'cues', jsonb_build_array('Use a comfortable range.', 'Keep breathing steady.', 'Move without bouncing or forcing.'),
    'mistakes', jsonb_build_array('Forcing range to create a stronger stretch.', 'Holding the breath.', 'Using momentum instead of controlled motion.'),
    'feel', 'Expect mild muscular effort or a comfortable stretch around ' || array_to_string(primary_muscles, ' and ') || ', not sharp joint pain.',
    'stopModify', 'Reduce the range or stop if you feel numbness, tingling, sharp, sudden, or worsening pain.'
  )
  else '{}'::jsonb end
where status = 'production' and movement_type <> 'DYNAMIC_REPS';

create or replace function public.exercise_quality_errors(e public.exercises)
returns text[] language sql stable set search_path = public as $$
  select array_remove(array[
    case when nullif(trim(e.name),'') is null or nullif(trim(e.slug),'') is null then 'IDENTITY_REQUIRED' end,
    case when nullif(trim(e.purpose),'') is null then 'DESCRIPTION_REQUIRED' end,
    case when cardinality(e.primary_muscles) = 0 or cardinality(e.required_equipment) = 0 then 'TAXONOMY_REQUIRED' end,
    case when e.movement_type is null or e.prescription_unit is null then 'MOVEMENT_TYPE_REQUIRED' end,
    case when e.movement_type in ('DYNAMIC_REPS','MOBILITY_REPS') and (e.rep_min is null or e.rep_max < e.rep_min) then 'REP_RANGE_INVALID' end,
    case when e.movement_type in ('TIMED_ISOMETRIC','LOADED_CARRY_TIME','CARDIO_TIME','MOBILITY_TIME') and (e.duration_min_seconds is null or e.duration_max_seconds < e.duration_min_seconds) then 'DURATION_RANGE_INVALID' end,
    case when e.movement_type in ('LOADED_CARRY_DISTANCE','CARDIO_DISTANCE') and (e.distance_min is null or e.distance_max < e.distance_min or e.distance_unit is null) then 'DISTANCE_RANGE_INVALID' end,
    case when e.movement_type = 'CARDIO_INTERVAL' and (e.interval_work_seconds is null or e.interval_recovery_seconds is null or e.interval_rounds_min is null) then 'INTERVAL_INVALID' end,
    case when lower(trim(coalesce(e.purpose,''))) in ('build controlled strength and skill in the listed primary muscles.','this movement develops strength and control.') then 'PLACEHOLDER_DESCRIPTION' end,
    case when e.movement_type = 'TIMED_ISOMETRIC' and lower(coalesce(e.education::text,'')) ~ '(final repetition|next repetition|concentric|eccentric)' then 'ISOMETRIC_REP_LANGUAGE' end,
    case when e.movement_type in ('CARDIO_TIME','CARDIO_DISTANCE','CARDIO_INTERVAL') and lower(coalesce(e.education::text,'')) ~ '(hypertrophy|weight stack|muscle contraction)' then 'CARDIO_LIFTING_LANGUAGE' end
  ], null);
$$;

create or replace function public.enforce_exercise_quality_gate()
returns trigger language plpgsql set search_path = public as $$
declare errors text[];
begin
  errors := public.exercise_quality_errors(new);
  new.schema_valid := not (errors && array['IDENTITY_REQUIRED','DESCRIPTION_REQUIRED','TAXONOMY_REQUIRED']);
  new.movement_type_valid := not (errors && array['MOVEMENT_TYPE_REQUIRED','REP_RANGE_INVALID','DURATION_RANGE_INVALID','DISTANCE_RANGE_INVALID','INTERVAL_INVALID','ISOMETRIC_REP_LANGUAGE','CARDIO_LIFTING_LANGUAGE']);
  new.semantic_validation_passed := not (errors && array['PLACEHOLDER_DESCRIPTION','ISOMETRIC_REP_LANGUAGE','CARDIO_LIFTING_LANGUAGE']);
  new.content_reviewed := new.technical_review_status = 'reviewed' and new.editorial_review_status = 'reviewed';
  new.quality_review_required := cardinality(errors) > 0 or not new.substitutions_validated or not new.media_validated or not new.content_reviewed;
  -- Only deterministic critical failures remove readiness automatically.
  -- Incomplete optional media or alternative review stays visible in QA without
  -- abruptly removing otherwise useful public instruction pages.
  if new.production_ready and cardinality(errors) > 0 then
    new.production_ready := false;
    new.review_status := 'review_required';
  end if;
  if not new.quality_review_required then new.quality_validated_at := now(); end if;
  return new;
end;
$$;

drop trigger if exists exercises_quality_gate on public.exercises;
create trigger exercises_quality_gate before insert or update on public.exercises
for each row execute function public.enforce_exercise_quality_gate();

-- Existing reviewed graph/media state is evaluated explicitly. Missing licensed
-- media is intentional and valid; broken references are not.
update public.exercises e set
  substitutions_validated = exists (
    select 1 from public.exercise_alternatives a
    join public.exercises target on target.id = a.alternative_id and target.status = 'production'
    where a.exercise_id = e.id and a.exercise_id <> a.alternative_id and a.review_status = 'reviewed'
  ),
  media_validated = not exists (
    select 1 from public.exercise_media m
    where m.exercise_id = e.id and (nullif(m.video_path,'') is null or nullif(m.poster_path,'') is null)
  ),
  content_reviewed = e.technical_review_status = 'reviewed' and e.editorial_review_status = 'reviewed'
where e.status = 'production';

-- Re-run the trigger for all production records after validation state is known.
update public.exercises set quality_validated_at = quality_validated_at where status = 'production';

create unique index if not exists exercise_alternatives_unique_edge
  on public.exercise_alternatives(exercise_id, alternative_id);
alter table public.exercise_alternatives drop constraint if exists exercise_alternatives_not_self;
alter table public.exercise_alternatives add constraint exercise_alternatives_not_self check (exercise_id <> alternative_id);

comment on column public.exercises.movement_type is 'Prescription semantics; distinct from broad exercise_type category.';
comment on column public.exercises.quality_review_required is 'True when deterministic publication checks or review gates are incomplete.';
