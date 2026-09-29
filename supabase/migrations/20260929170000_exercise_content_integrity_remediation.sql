-- Remediate Product 16 placeholder descriptions and prevent known content
-- contamination from being marked production-ready again.

update public.exercises
set purpose = format(
  '%s is a %s exercise using %s that primarily trains %s. Use it to build controlled strength and skill through a repeatable range of motion.',
  name,
  replace(movement_pattern, '_', ' '),
  case
    when cardinality(required_equipment) = 0 then 'bodyweight'
    else array_to_string(required_equipment, ', ')
  end,
  array_to_string(primary_muscles, ' and ')
),
content_version = '20.1.0'
where status = 'production'
  and lower(trim(purpose)) = 'build controlled strength and skill in the listed primary muscles.';

create or replace function public.exercise_content_integrity_valid(
  p_name text,
  p_slug text,
  p_purpose text,
  p_education jsonb
) returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    nullif(trim(p_purpose), '') is not null
    and lower(trim(p_purpose)) <> 'build controlled strength and skill in the listed primary muscles.'
    and not (
      lower(coalesce(p_name, '') || ' ' || coalesce(p_slug, '')) ~ '(ab wheel|upright row|jump squat)'
      and lower(coalesce(p_purpose, '') || ' ' || coalesce(p_education::text, ''))
        ~ '(outer-glute activation|one-arm push-up)'
    )
    and not (
      lower(coalesce(p_name, '') || ' ' || coalesce(p_slug, '')) ~ 'upright row'
      and lower(coalesce(p_purpose, '') || ' ' || coalesce(p_education::text, ''))
        ~ 'standing forward fold into a plank'
    );
$$;

create or replace function public.enforce_exercise_content_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'production' and new.production_ready and not public.exercise_content_integrity_valid(
    new.name,
    new.slug,
    new.purpose,
    new.education
  ) then
    raise exception 'Exercise % cannot be production-ready: content integrity validation failed', new.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists exercises_content_integrity_gate on public.exercises;
create trigger exercises_content_integrity_gate
before insert or update of name, slug, purpose, education, status, production_ready
on public.exercises
for each row execute function public.enforce_exercise_content_integrity();

do $$
declare
  production_count integer;
  audited_count integer;
  invalid_count integer;
begin
  select count(*) into production_count from public.exercises where status = 'production';
  select count(*) into audited_count from public.exercises where status = 'production';
  select count(*) into invalid_count
  from public.exercises
  where status = 'production'
    and production_ready
    and not public.exercise_content_integrity_valid(name, slug, purpose, education);

  if audited_count <> production_count then
    raise exception 'Production exercise audit incomplete: % of %', audited_count, production_count;
  end if;
  if invalid_count <> 0 then
    raise exception 'Production exercise integrity gate failed for % records', invalid_count;
  end if;
end;
$$;
