import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = process.argv[2];
if (!output) throw new Error("Migration path required");
const manifest = JSON.parse(await readFile(path.join(root, "src/modules/exercise-media/vital-manifest.json"), "utf8"));
const rows = Object.entries(manifest).map(([slug, media]) => ({ slug, ...media }));
const payload = JSON.stringify(rows);
const sql = `-- Purchased Vital media is the only video source. Exercises without it remain instructions-only.
create temporary table purchased_media_payload(payload jsonb) on commit drop;
insert into purchased_media_payload values ($purchased$${payload}$purchased$::jsonb);

with source as (select value e from purchased_media_payload, jsonb_array_elements(payload))
update public.exercise_media m set
  video_path = s.e->>'videoPath',
  poster_path = s.e->>'posterPath',
  provenance = 'Vital Animations licensed provider asset',
  render_version = 'vital-ingest-1.0.0',
  review_status = 'approved',
  reviewed_at = now()
from source s join public.exercises x on x.slug=s.e->>'slug'
where m.exercise_id=x.id;

delete from public.exercise_media m
where not exists (
  select 1 from public.exercises x, purchased_media_payload p
  where x.id=m.exercise_id
    and exists (select 1 from jsonb_array_elements(p.payload) e where e->>'slug'=x.slug)
);

do $$ begin
  if (select count(*) from public.exercise_media where review_status='approved') <> 298 then
    raise exception 'Expected exactly 298 purchased media mappings';
  end if;
  if exists (select 1 from public.exercise_media where provenance <> 'Vital Animations licensed provider asset') then
    raise exception 'Generated fallback media still present';
  end if;
end $$;
`;
await writeFile(path.resolve(output), sql);
console.log(`Wrote ${rows.length} purchased-only mappings to ${output}`);
