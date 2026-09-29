alter table public.exercises
  add column if not exists guidance_provenance jsonb not null default '{}'::jsonb,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_source text,
  add column if not exists updated_at timestamptz not null default now();

update public.exercises
set guidance_provenance=jsonb_build_object(
  'setup','REVIEWED','execution','REVIEWED','cues','REVIEWED',
  'mistakes','REVIEWED','feel','REVIEWED','stopModify','REVIEWED'
), reviewed_at=coalesce(reviewed_at,quality_validated_at,created_at),
   review_source=coalesce(review_source,'migration_history'), updated_at=now()
where status='production' and production_ready and review_status='reviewed';

create or replace function public.enforce_exercise_canonical_guidance()
returns trigger language plpgsql set search_path='' as $$
declare missing text[] := '{}'::text[];
begin
  new.updated_at := now();
  if new.status='production' and new.production_ready then
    if nullif(btrim(coalesce(new.purpose,'')),'') is null then missing:=array_append(missing,'purpose'); end if;
    if jsonb_typeof(new.education->'setup')<>'array' or jsonb_array_length(new.education->'setup')=0 then missing:=array_append(missing,'setup'); end if;
    if jsonb_typeof(new.education->'execution')<>'array' or jsonb_array_length(new.education->'execution')=0 then missing:=array_append(missing,'execution'); end if;
    if jsonb_typeof(new.education->'cues')<>'array' or jsonb_array_length(new.education->'cues')=0 then missing:=array_append(missing,'cues'); end if;
    if jsonb_typeof(new.education->'mistakes')<>'array' or jsonb_array_length(new.education->'mistakes')=0 then missing:=array_append(missing,'mistakes'); end if;
    if nullif(btrim(coalesce(new.education->>'feel','')),'') is null then missing:=array_append(missing,'feel'); end if;
    if nullif(btrim(coalesce(new.education->>'stopModify','')),'') is null then missing:=array_append(missing,'stopModify'); end if;
    if new.movement_type is null then missing:=array_append(missing,'movement_type'); end if;
    if new.movement_pattern is null then missing:=array_append(missing,'movement_pattern'); end if;
    if cardinality(new.primary_muscles)=0 then missing:=array_append(missing,'primary_muscles'); end if;
    if cardinality(new.required_equipment)=0 then missing:=array_append(missing,'required_equipment'); end if;
    if cardinality(missing)>0 then raise exception 'Production-ready exercise % missing canonical fields: %',new.slug,array_to_string(missing,','); end if;
    if coalesce(new.guidance_provenance,'{}'::jsonb) @> '{"setup":"FALLBACK"}'::jsonb
       or coalesce(new.guidance_provenance,'{}'::jsonb) @> '{"execution":"FALLBACK"}'::jsonb
       or coalesce(new.guidance_provenance,'{}'::jsonb) @> '{"cues":"FALLBACK"}'::jsonb
       or coalesce(new.guidance_provenance,'{}'::jsonb) @> '{"mistakes":"FALLBACK"}'::jsonb
       or coalesce(new.guidance_provenance,'{}'::jsonb) @> '{"feel":"FALLBACK"}'::jsonb
       or coalesce(new.guidance_provenance,'{}'::jsonb) @> '{"stopModify":"FALLBACK"}'::jsonb then
      raise exception 'Production-ready exercise % cannot use fallback guidance',new.slug;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists exercises_canonical_guidance_gate on public.exercises;
create trigger exercises_canonical_guidance_gate
before insert or update on public.exercises for each row
execute function public.enforce_exercise_canonical_guidance();

comment on column public.exercises.guidance_provenance is 'Per-field source: REVIEWED, CURATED, GENERATED_DRAFT, FALLBACK, or MISSING. Production-ready records may not use FALLBACK.';
