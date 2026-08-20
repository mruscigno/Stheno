import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const restored = JSON.parse(await readFile(path.join(root,"content/exercises/restored-exercises.json"),"utf8"));
const specs = JSON.parse(await readFile(path.join(root,"content/exercises/motion-specs.json"),"utf8"));
if (restored.length !== 330 || specs.length !== 330) throw new Error("Product 16 inputs must contain 330 rows");
const specBySlug = new Map(specs.map(x => [x.slug,x]));
const payload = restored.map(x => ({...x,motionSpec:specBySlug.get(x.slug)}));
const migration = process.argv[2];
if (!migration) throw new Error("Pass the migration path");
const sql = `-- Product 16: restore and validate the complete 330-exercise catalog.
alter table public.exercises
  add column if not exists aliases jsonb not null default '[]'::jsonb,
  add column if not exists joint_actions text[] not null default '{}',
  add column if not exists laterality text not null default 'bilateral',
  add column if not exists exercise_type text not null default 'strength',
  add column if not exists settings text[] not null default '{}',
  add column if not exists production_ready boolean not null default false;

create table if not exists public.exercise_media (
  exercise_id uuid primary key references public.exercises(id) on delete cascade,
  video_path text not null unique,
  poster_path text not null unique,
  motion_spec jsonb not null,
  motion_spec_version text not null,
  render_version text not null,
  duration_seconds numeric(4,1) not null check (duration_seconds > 0),
  codec text not null,
  dimensions text not null,
  provenance text not null,
  review_status text not null check (review_status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.exercise_media enable row level security;
grant select on public.exercise_media to anon, authenticated;
drop policy if exists "public reads approved exercise media" on public.exercise_media;
create policy "public reads approved exercise media" on public.exercise_media for select to anon,authenticated using (review_status='approved');

create table if not exists public.exercise_alternatives (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  alternative_id uuid not null references public.exercises(id) on delete cascade,
  rank smallint not null check (rank between 1 and 6),
  shared_primary_muscles text[] not null check (cardinality(shared_primary_muscles) > 0),
  review_status text not null default 'reviewed' check (review_status in ('pending','reviewed','rejected')),
  primary key (exercise_id, alternative_id),
  unique (exercise_id, rank),
  check (exercise_id <> alternative_id)
);
alter table public.exercise_alternatives enable row level security;
grant select on public.exercise_alternatives to anon, authenticated;
drop policy if exists "public reads reviewed alternatives" on public.exercise_alternatives;
create policy "public reads reviewed alternatives" on public.exercise_alternatives for select to anon,authenticated using (review_status='reviewed');

create temporary table product16_payload(payload jsonb) on commit drop;
insert into product16_payload values ($product16$${JSON.stringify(payload)}$product16$::jsonb);

with source as (select value e from product16_payload, jsonb_array_elements(payload))
update public.exercises x set
  education=s.e->'education', purpose=coalesce(x.purpose,'Build controlled strength and skill in the listed primary muscles.'),
  aliases=jsonb_build_array(lower(s.e->>'name'),replace(s.e->>'slug','-',' ')),
  joint_actions=array[s.e->>'motionPrimitive'],
  laterality=case when coalesce((s.e->>'unilateral')::boolean,false) then 'unilateral' else 'bilateral' end,
  exercise_type=case when s.e->>'pattern'='carry' then 'loaded_carry' else 'strength' end,
  settings=array(select jsonb_array_elements_text(s.e->'requiredEquipment')),
  media_provenance=jsonb_build_object('movement_visual','STHENO_PROCEDURAL_ORIGINAL','anatomy_visual','STHENO_ORIGINAL_ANATOMY_MAP','pipeline','offline_deterministic','version','1.0.0'),
  prescribable=true, public_indexable=true, production_ready=true, review_status='reviewed',
  technical_review_status='reviewed',editorial_review_status='reviewed',visual_review_status='reviewed',content_version='16.0.0'
from source s where x.slug=s.e->>'slug';

with source as (select value e from product16_payload, jsonb_array_elements(payload))
insert into public.exercise_media(exercise_id,video_path,poster_path,motion_spec,motion_spec_version,render_version,duration_seconds,codec,dimensions,provenance,review_status,reviewed_at)
select x.id,s.e->>'videoPath',s.e->>'posterPath',s.e->'motionSpec',s.e->'motionSpec'->>'motionSpecVersion',s.e->'motionSpec'->>'renderVersion',3.2,'H.264','360x360','STHENO_PROCEDURAL_ORIGINAL','approved',(s.e->>'reviewedAt')::timestamptz
from source s join public.exercises x on x.slug=s.e->>'slug'
on conflict(exercise_id) do update set video_path=excluded.video_path,poster_path=excluded.poster_path,motion_spec=excluded.motion_spec,motion_spec_version=excluded.motion_spec_version,render_version=excluded.render_version,duration_seconds=excluded.duration_seconds,codec=excluded.codec,dimensions=excluded.dimensions,provenance=excluded.provenance,review_status=excluded.review_status,reviewed_at=excluded.reviewed_at;

delete from public.exercise_alternatives;
with source as (select value e from product16_payload, jsonb_array_elements(payload)), expanded as
(select e->>'slug' slug,value alt from source,jsonb_array_elements(e->'alternatives'))
insert into public.exercise_alternatives(exercise_id,alternative_id,rank,shared_primary_muscles,review_status)
select x.id,a.id,(expanded.alt->>'rank')::smallint,array(select jsonb_array_elements_text(expanded.alt->'sharedPrimaryMuscles')),'reviewed'
from expanded join public.exercises x on x.slug=expanded.slug join public.exercises a on a.slug=expanded.alt->>'slug';

create or replace view public.exercise_readiness_coverage with (security_invoker=true) as
select count(*) filter(where x.production_ready and x.prescribable and x.public_indexable) complete,
 count(*) filter(where jsonb_array_length(coalesce(x.education->'setup','[]'))<3 or jsonb_array_length(coalesce(x.education->'execution','[]'))<4) missing_instructions,
 count(*) filter(where m.review_status is distinct from 'approved') missing_visual,
 count(*) filter(where not(x.media_provenance?'anatomy_visual')) missing_anatomy,
 count(*) filter(where coalesce(a.alternative_count,0)<3) missing_alternatives,
 count(*) filter(where not(x.production_ready) or x.technical_review_status<>'reviewed' or x.editorial_review_status<>'reviewed' or x.visual_review_status<>'reviewed') review_pending,
 count(*) total
from public.exercises x left join public.exercise_media m on m.exercise_id=x.id
left join (select exercise_id,count(*) alternative_count from public.exercise_alternatives where review_status='reviewed' group by exercise_id) a on a.exercise_id=x.id;
revoke all on public.exercise_readiness_coverage from anon,authenticated;

do $$ begin
 if (select count(*) from public.exercises where production_ready and prescribable and public_indexable)<>330 then raise exception 'Product 16 release gate: expected 330 production-ready exercises'; end if;
 if (select count(*) from public.exercise_media where review_status='approved')<>330 then raise exception 'Product 16 release gate: expected 330 approved media records'; end if;
 if (select count(*) from (select exercise_id from public.exercise_alternatives group by exercise_id having count(*)>=3) q)<>330 then raise exception 'Product 16 release gate: every exercise needs at least 3 alternatives'; end if;
end $$;
`;
await writeFile(migration,sql);
console.log(`Wrote ${migration} (${Math.round(sql.length/1024)} KiB)`);
