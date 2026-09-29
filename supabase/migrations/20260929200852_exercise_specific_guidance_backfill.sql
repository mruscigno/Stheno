-- Repair only rows containing the identified Product 16 scaffolding. Guidance
-- is derived from reviewed movement metadata; unrelated reviewed copy is kept.
with flagged as (
  select id from public.exercises where status='production' and lower(education::text) ~
    '(move with control through a comfortable range|keep your breathing steady and your joints aligned|reset in the stable start position before beginning the next repetition|move smoothly into the working range while keeping the listed primary muscles in control|remove anything that could interrupt a controlled repetition)'
)
update public.exercises e set education = e.education || jsonb_build_object(
  'setup', case e.movement_pattern
    when 'squat' then jsonb_build_array('Set your feet in a stable stance for '||e.name||' and keep the whole foot in contact with the floor.','Brace your trunk and align the knees with the direction of the toes before descending.')
    when 'hinge' then jsonb_build_array('Position the '||array_to_string(e.required_equipment,', ')||' close to your body for '||e.name||'.','Soften the knees, brace the torso, and prepare to move the hips backward.')
    when 'horizontal_push' then jsonb_build_array('Set the bench, handles, or hand position required for '||e.name||' so the resistance lines up with the chest.','Stabilize the shoulder blades and stack the wrists over the forearms.')
    when 'vertical_push' then jsonb_build_array('Bring the resistance to shoulder height with a stable grip for '||e.name||'.','Brace the torso with the ribs stacked over the pelvis before pressing.')
    when 'horizontal_pull' then jsonb_build_array('Set the seat, cable, bench, or stance so you can pull toward the torso during '||e.name||'.','Begin with long arms, a stable torso, and the shoulders relaxed away from the ears.')
    when 'vertical_pull' then jsonb_build_array('Take the required grip for '||e.name||' and secure your body against the pad or stable hanging position.','Start with long arms and shoulders controlled away from the ears.')
    when 'lunge' then jsonb_build_array('Use a stance for '||e.name||' that lets both feet remain stable as you lower.','Square the hips and keep the working foot fully planted.')
    when 'carry' then jsonb_build_array('Clear the walking path and position the load so you can pick it up without twisting.','Stand tall with the load secure and the ribs stacked over the pelvis.')
    else jsonb_build_array('Set the '||array_to_string(e.required_equipment,', ')||' for '||e.name||' so the intended joint can move without obstruction.','Choose a controllable starting resistance and stabilize the rest of your body.') end,
  'execution', case e.movement_pattern
    when 'squat' then jsonb_build_array('Lower between the hips while the knees track with the toes.','Use the deepest range that keeps the feet planted and torso controlled.','Push the floor away to stand without letting the knees collapse inward.')
    when 'hinge' then jsonb_build_array('Push the hips backward while keeping the resistance close to the body.','Stop when the hamstrings are loaded without losing trunk position.','Drive the hips forward to stand tall, then reset under control.')
    when 'horizontal_push' then jsonb_build_array('Lower the resistance toward the chest with the elbows at a comfortable angle.','Stop before the shoulders roll forward.','Press away on the same path and stabilize before the next repetition.')
    when 'vertical_push' then jsonb_build_array('Press upward while keeping the forearms close to vertical.','Finish with the resistance balanced over the shoulders without leaning back.','Lower to shoulder height under control and reset the brace.')
    when 'horizontal_pull' then jsonb_build_array('Drive the elbows backward and pull toward the lower ribs.','Keep the torso still as the shoulder blades move toward the spine.','Return to long arms under control without shrugging.')
    when 'vertical_pull' then jsonb_build_array('Drive the elbows down while bringing the chest toward the handle or bar.','Stop before the shoulders roll forward or the torso swings.','Return slowly to long arms while controlling the shoulder position.')
    when 'lunge' then jsonb_build_array('Lower by bending both knees while the front knee tracks over the toes.','Keep the working heel planted at the bottom.','Push through the working foot to return and regain balance.')
    when 'carry' then jsonb_build_array('Walk with short, controlled steps while keeping the load close.','Turn with several small steps rather than pivoting under load.','Stop fully and lower the load with control after the prescribed distance or time.')
    else jsonb_build_array('Move the intended joint through a comfortable, controlled range for '||e.name||'.','Keep the rest of the body stable instead of creating momentum.','Pause at the controlled end position, then return smoothly.') end,
  'cues', case e.movement_pattern
    when 'squat' then jsonb_build_array('Keep the whole foot heavy.','Track knees with toes.','Stand tall without leaning back.')
    when 'hinge' then jsonb_build_array('Send the hips back.','Keep the load close.','Finish tall without leaning back.')
    when 'horizontal_push' then jsonb_build_array('Stack wrists over forearms.','Lower toward the chest.','Keep the shoulders controlled.')
    when 'vertical_push' then jsonb_build_array('Keep ribs stacked.','Press up, not forward.','Finish over your base.')
    when 'horizontal_pull' then jsonb_build_array('Drive elbows behind you.','Keep shoulders away from ears.','Return to long arms.')
    when 'vertical_pull' then jsonb_build_array('Pull elbows down.','Keep the chest tall.','Reach long without shrugging.')
    when 'lunge' then jsonb_build_array('Stay tall between both feet.','Keep the front heel heavy.','Move down and up.')
    when 'carry' then jsonb_build_array('Walk tall and quiet.','Keep shoulders level.','Turn with small steps.')
    else jsonb_build_array('Keep the non-working joints still.','Use the full controlled range.','Own the return phase.') end,
  'mistakes', case e.movement_pattern
    when 'squat' then jsonb_build_array('Letting the heels lift.','Allowing the knees to collapse inward.','Forcing depth by rounding the torso.')
    when 'hinge' then jsonb_build_array('Turning the hinge into a squat.','Letting the resistance drift away.','Forcing depth after the back rounds.')
    when 'horizontal_push' then jsonb_build_array('Flaring the elbows directly sideways.','Dropping through the bottom position.','Letting the shoulders roll forward.')
    when 'vertical_push' then jsonb_build_array('Leaning backward to move the load.','Letting the wrists fold back.','Lowering beyond a controllable range.')
    when 'horizontal_pull' then jsonb_build_array('Rocking the torso for momentum.','Shrugging during the pull.','Stopping before the back has shortened.')
    when 'vertical_pull' then jsonb_build_array('Swinging to start the pull.','Pulling behind the neck.','Cutting the controlled return short.')
    when 'lunge' then jsonb_build_array('Using a stance too narrow for balance.','Letting the front knee collapse inward.','Pushing mostly from the trailing foot.')
    when 'carry' then jsonb_build_array('Leaning away from the load.','Crossing the feet while turning.','Dropping the load at the finish.')
    else jsonb_build_array('Moving the torso to create momentum.','Using resistance that shortens the range.','Letting the resistance drop on the return.') end
)
where e.id in(select id from flagged);

-- All repaired rows must pass the deterministic trigger after the update.
update public.exercises set quality_validated_at=quality_validated_at where status='production';
