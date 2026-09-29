-- Corrections found by the stratified 50-record editorial sample.
update public.exercises set movement_type='MOBILITY_REPS',prescription_unit='reps',rep_min=8,rep_max=15,duration_min_seconds=null,duration_max_seconds=null
where status='production' and exercise_type in('mobility','stretching') and lower(name) ~ '(dynamic|swing|circle|sweep|flow)';

update public.exercises set movement_type='TIMED_ISOMETRIC',prescription_unit='seconds',duration_min_seconds=10,duration_max_seconds=30,rep_min=null,rep_max=null
where status='production' and exercise_type='balance' and lower(name) ~ '(pose|stand|hold|balance)';

update public.exercises set movement_pattern='isolation'
where status='production' and lower(name) ~ '(y.?raise|lateral raise|front raise|reverse fly|snow angel)' and movement_pattern in('vertical_pull','vertical_push','horizontal_pull');

update public.exercises e set purpose=
  e.name||' uses '||array_to_string(e.required_equipment,', ')||' in a '||replace(e.movement_pattern,'_',' ')||' movement that primarily trains '||array_to_string(e.primary_muscles,' and ')||'. '||
  case e.movement_pattern
    when 'squat' then 'Use it to build lower-body strength while practicing controlled knee and hip movement.'
    when 'hinge' then 'Use it to train the posterior chain and reinforce a controlled hip hinge.'
    when 'horizontal_push' then 'Use it to build pressing strength across the chest and arms.'
    when 'vertical_push' then 'Use it to build overhead pressing strength and shoulder control.'
    when 'horizontal_pull' then 'Use it to build upper-back strength and controlled shoulder-blade movement.'
    when 'vertical_pull' then 'Use it to build pulling strength through the back and arms.'
    when 'lunge' then 'Use it to train each leg through a split stance while challenging balance and control.'
    when 'carry' then 'Use it to train grip, posture, and trunk control while moving under load.'
    else 'Use it to train the target muscles through a stable, measurable range.' end
where e.status='production' and lower(e.purpose) like '%use it to build controlled strength and skill through a repeatable range of motion%';

-- Rebuild instructions for the small pattern-correction set rather than leaving
-- vertical-pull mechanics on shoulder-raise exercises.
update public.exercises e set education=e.education||jsonb_build_object(
  'setup',jsonb_build_array('Position the '||array_to_string(e.required_equipment,', ')||' for '||e.name||' and choose a light, controllable resistance.','Stabilize the torso and begin with the arms in the exercise-specific starting position.'),
  'execution',jsonb_build_array('Raise the arms along the intended path without shrugging or swinging the torso.','Stop at the highest position the shoulders can control.','Lower slowly to the start while keeping tension on the target muscles.'),
  'cues',jsonb_build_array('Keep the neck relaxed.','Lead with the elbows.','Lower under control.'),
  'mistakes',jsonb_build_array('Shrugging toward the ears.','Swinging the torso to lift the resistance.','Using a load that shortens the controlled range.')
) where e.status='production' and e.movement_pattern='isolation' and lower(e.name) ~ '(y.?raise|lateral raise|front raise|reverse fly|snow angel)';

update public.exercises set quality_validated_at=quality_validated_at where status='production';
