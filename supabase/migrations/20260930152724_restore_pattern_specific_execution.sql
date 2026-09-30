-- The setup remediation also touched the execution object. Restore precise
-- pattern-specific execution for presses and rows while retaining the new
-- equipment-specific setup text.
update public.exercises e
set education = e.education || jsonb_build_object(
  'execution', case e.movement_pattern
    when 'horizontal_pull' then jsonb_build_array(
      'Drive your elbows behind you and bring the handle or weights toward your lower ribs.',
      'Keep the torso still while the shoulder blades move toward the spine.',
      'Reach back to long arms under control without shrugging or losing your supported position.'
    )
    when 'horizontal_push' then jsonb_build_array(
      'Lower the resistance toward the chest with the forearms close to vertical.',
      'Stop before the shoulders roll forward or the upper arms move beyond a controllable range.',
      'Press the resistance away along the same path and stabilize before repeating.'
    )
  end),
  guidance_provenance = coalesce(e.guidance_provenance, '{}'::jsonb) || jsonb_build_object('execution','CURATED'),
  updated_at = now()
where e.status = 'production'
  and e.production_ready is true
  and e.review_source = 'canonical_guidance_quality_remediation'
  and e.movement_pattern in ('horizontal_pull','horizontal_push');
