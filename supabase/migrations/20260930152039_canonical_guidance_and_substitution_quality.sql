-- Replace the remaining migration-generated scaffolding in canonical records.
-- This runs upstream: public pages and authenticated APIs continue to render
-- the stored reviewed fields without request-time rewriting.

update public.exercises e
set education = e.education || jsonb_build_object(
  'setup', case
    when e.slug = 'dumbbell-overhead-standard' then jsonb_build_array(
      'Stand with a dumbbell in each hand at shoulder height, palms facing slightly forward.',
      'Set your feet about hip-width apart, brace your abdomen, and keep your ribs stacked over your pelvis.'
    )
    when e.movement_pattern = 'horizontal_pull' and e.required_equipment @> array['cables']::text[] then jsonb_build_array(
      'Attach the selected handle to the low cable and sit where the cable tracks toward your lower ribs.',
      'Brace your feet, sit tall with long arms, and let the shoulders reach forward without rounding your lower back.'
    )
    when e.movement_pattern = 'horizontal_pull' and e.required_equipment @> array['machines']::text[] then jsonb_build_array(
      'Adjust the seat and chest support so the handles line up with your lower chest and your feet are secure.',
      'Take the handles with long arms, keep your chest supported, and relax your shoulders away from your ears.'
    )
    when e.movement_pattern = 'horizontal_pull' and e.required_equipment @> array['bench']::text[] then jsonb_build_array(
      'Set the bench angle and lie chest-down with a dumbbell hanging from each hand.',
      'Plant your feet, keep your chest on the pad, and begin with long arms and relaxed shoulders.'
    )
    when e.movement_pattern = 'horizontal_pull' then jsonb_build_array(
      'Take a stable position that lets the resistance travel toward your lower ribs.',
      'Begin with long arms, a quiet torso, and your shoulders relaxed away from your ears.'
    )
    when e.movement_pattern = 'horizontal_push' and e.required_equipment @> array['barbell','bench']::text[] then jsonb_build_array(
      'Set the bench and rack so you can unrack the bar with straight arms and the bar above your upper chest.',
      'Plant your feet, draw your shoulder blades into the bench, and wrap your thumbs around the bar.'
    )
    when e.movement_pattern = 'horizontal_push' and e.required_equipment @> array['dumbbells','bench']::text[] then jsonb_build_array(
      'Sit with the dumbbells on your thighs, then lie back and bring them over your chest with straight wrists.',
      'Plant your feet and keep your shoulder blades supported by the bench before the first repetition.'
    )
    when e.family in ('elbow_flexion','upper_arms') and e.primary_muscles @> array['biceps']::text[] then jsonb_build_array(
      'Hold the resistance with your wrists neutral and your upper arms resting beside your torso.',
      'Stand or sit tall, brace lightly, and begin with the elbows extended without forcing them backward.'
    )
    when e.family = 'elbow_extension' or e.primary_muscles @> array['triceps']::text[] then jsonb_build_array(
      'Choose a grip that keeps your wrists straight and place your upper arms in the position required by the exercise.',
      'Brace your torso and begin with the elbows bent while keeping the shoulders quiet.'
    )
    when e.family in ('lateral_raise','front_raise','rear_delt_fly','shoulder_flexion') then jsonb_build_array(
      'Hold a light, controllable resistance and set your arms in the starting path described by the exercise.',
      'Stand or sit tall with soft elbows, a braced torso, and your shoulders relaxed away from your ears.'
    )
    when e.family in ('knee_flexion','knee_extension','calf_raise') then jsonb_build_array(
      'Align the machine or resistance with the working joint and secure any pad without compressing the joint.',
      'Choose a load you can move without lifting your hips or shifting away from the support.'
    )
    when e.family in ('anti_rotation','anti_extension','lateral_core','trunk_flexion','trunk_extension','trunk_rotation','waist') then jsonb_build_array(
      'Take the exercise-specific start position with your hands, feet, and resistance secured.',
      'Brace your abdomen before moving and keep your pelvis and rib cage aligned.'
    )
    else jsonb_build_array(
      'Set the listed equipment in a stable position and choose a resistance you can control through the full exercise.',
      'Take the exercise-specific starting position, brace the non-working joints, and clear the movement path.'
    )
  end,
  'execution', case
    when e.slug = 'dumbbell-overhead-standard' then jsonb_build_array(
      'Press both dumbbells upward until they finish over your shoulders without leaning your torso backward.',
      'Keep your forearms close to vertical and avoid knocking the dumbbells together overhead.',
      'Lower the dumbbells to shoulder height under control and reset your brace before the next repetition.'
    )
    when e.family in ('elbow_flexion','upper_arms') and e.primary_muscles @> array['biceps']::text[] then jsonb_build_array(
      'Bend the elbows to bring the resistance toward the shoulders without letting the upper arms swing forward.',
      'Squeeze briefly at the top while keeping the wrists aligned with the forearms.',
      'Lower to nearly straight arms under control before beginning the next repetition.'
    )
    when e.family = 'elbow_extension' or e.primary_muscles @> array['triceps']::text[] then jsonb_build_array(
      'Straighten the elbows while keeping the upper arms in their starting position.',
      'Finish with the arms long without forcing or snapping the elbows.',
      'Allow the elbows to bend under control until you return to the starting stretch.'
    )
    when e.family in ('lateral_raise','front_raise','rear_delt_fly','shoulder_flexion') then jsonb_build_array(
      'Raise the arms along the exercise path without shrugging or swinging your torso.',
      'Stop at the highest position you can control while keeping the neck relaxed.',
      'Lower slowly until the resistance returns to the starting position.'
    )
    when e.family = 'knee_flexion' then jsonb_build_array(
      'Bend the knees to move the pad through the available range without lifting your hips.',
      'Pause when the hamstrings are fully shortened and the pelvis is still.',
      'Return slowly until the knees are nearly straight without letting the weight stack slam.'
    )
    when e.family = 'knee_extension' then jsonb_build_array(
      'Straighten the knees to raise the pad while keeping your hips against the seat.',
      'Stop short of a forced lockout and briefly contract the quadriceps.',
      'Lower under control until the knees return to a comfortable bend.'
    )
    when e.family = 'calf_raise' then jsonb_build_array(
      'Press through the balls of your feet and raise the heels as high as you can without rolling the ankles.',
      'Pause briefly at the top with the knees in their intended position.',
      'Lower the heels slowly into a comfortable calf stretch before repeating.'
    )
    when e.family in ('anti_rotation','anti_extension','lateral_core') then jsonb_build_array(
      'Create abdominal tension and resist the direction the load is trying to pull your trunk.',
      'Breathe without losing the stacked rib and pelvis position.',
      'Finish the prescribed repetition or hold before your trunk begins to rotate, arch, or sag.'
    )
    when e.family in ('trunk_flexion','trunk_extension','trunk_rotation','waist') then jsonb_build_array(
      'Move the trunk through the exercise-specific path while the hips and limbs remain controlled.',
      'Use a range you can own without pulling on the neck or using momentum.',
      'Return slowly to the starting position and re-establish your brace.'
    )
    else jsonb_build_array(
      'Move through the exercise-specific path without borrowing momentum from the torso or adjacent joints.',
      'Use the largest comfortable range you can control while keeping the resistance aligned.',
      'Return deliberately to the starting position and reset before repeating.'
    )
  end
),
guidance_provenance = coalesce(e.guidance_provenance, '{}'::jsonb) ||
  jsonb_build_object('setup','CURATED','execution','CURATED'),
review_source = 'canonical_guidance_quality_remediation',
reviewed_at = now(),
updated_at = now()
where e.status = 'production'
  and e.production_ready is true
  and (
    e.education->>'setup' like '%seat, cable, bench, or stance%'
    or e.education->>'setup' like '%bench, handles, or hand position%'
    or e.education->>'setup' like '%so the intended joint can move without obstruction%'
    or e.education->>'execution' like '%Move the intended joint through a comfortable, controlled range%'
  );

update public.exercises
set movement_pattern = 'vertical_push',
    family = 'overhead_press',
    exercise_role = 'primary',
    updated_at = now()
where slug = 'dumbbell-overhead-standard';

create or replace function public.enforce_exercise_copy_quality()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'production' and new.production_ready is true then
    if lower(coalesce(new.purpose,'')) ~ '(listed primary muscles|controlled strength and skill in the target|develop strength and control in the target)' then
      raise exception 'Production exercise purpose contains placeholder language';
    end if;
    if lower(coalesce(new.education::text,'')) ~ '(seat, cable, bench, or stance|bench, handles, or hand position|intended joint can move without obstruction|move the intended joint through a comfortable, controlled range)' then
      raise exception 'Production exercise guidance contains generic scaffolding';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists exercise_copy_quality_gate on public.exercises;
create trigger exercise_copy_quality_gate
before insert or update on public.exercises
for each row execute function public.enforce_exercise_copy_quality();
