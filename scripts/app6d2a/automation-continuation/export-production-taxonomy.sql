select jsonb_build_object(
  'id', id,
  'slug', slug,
  'name', name,
  'aliases', aliases,
  'equipment', required_equipment,
  'primary_muscles', primary_muscles,
  'secondary_muscles', secondary_muscles,
  'movement_pattern', movement_pattern,
  'public_indexable', public_indexable,
  'prescribable', prescribable
) as exercise
from public.exercises
order by slug;
