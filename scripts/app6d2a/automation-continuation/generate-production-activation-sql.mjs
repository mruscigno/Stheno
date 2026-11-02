import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "docs/mobile/app6d2a/automation-continuation/MEDIA_UPLOAD_MANIFEST.csv");
const dispositionsPath = path.join(root, "docs/mobile/app6d2a/automation-continuation/FULL_ASSET_DISPOSITIONS.csv");
const outputPath = path.join(root, "artifacts/app6d2a-private/production-activation.sql");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ""; }
    else if (char === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...values] = rows.filter((candidate) => candidate.some(Boolean));
  return values.map((value) => Object.fromEntries(headers.map((header, index) => [header, value[index] ?? ""])));
}

const q = (value) => `'${String(value).replaceAll("'", "''")}'`;
const manifest = parseCsv(await readFile(manifestPath, "utf8"));
const dispositions = new Map(parseCsv(await readFile(dispositionsPath, "utf8")).map((row) => [row.asset_id, row]));

const blocks = manifest.map((row) => {
  const source = dispositions.get(row.review_asset_id);
  if (!source) throw new Error(`Missing disposition for ${row.review_asset_id}`);
  const videoKey = `exercise-media/6d2/${row.source_sha256}/primary.mp4`;
  const posterKey = `exercise-media/6d2/${row.source_sha256}/poster.webp`;
  return `
do $activation$
declare
  v_exercise_id uuid;
  v_video_id uuid;
  v_poster_id uuid;
  v_link_id uuid;
begin
  select id into strict v_exercise_id from public.exercises where slug = ${q(row.canonical_slug)};

  insert into public.exercise_media_assets (
    id, sha256, source_collection, source_entry, original_mime, original_bytes,
    license_reference, rights, review_state
  ) values (
    ${q(row.asset_id)}, ${q(row.source_sha256)}, 'stheno-6d2', ${q(source.entry_path)},
    'image/gif', ${Number(row.source_bytes)}, 'STHENO commercial media purchase confirmation',
    '{"commercial_use_confirmed":true,"redistribution":"delivered inside STHENO product"}'::jsonb, 'approved'
  ) on conflict (id) do update set review_state = 'approved', updated_at = now();

  insert into public.exercise_media_derivatives (
    asset_id, kind, storage_key, mime_type, bytes, width, height, codec, sha256, conversion, approved
  ) values (
    ${q(row.asset_id)}, 'video_mp4', ${q(videoKey)}, 'video/mp4', ${Number(row.video_bytes)}, 720, 720,
    'h264', ${q(row.video_sha256)}, ${q(JSON.stringify({ profile: row.conversion_profile, audio: row.video_audio, frame_rate: Number(row.video_frame_rate) }))}::jsonb, true
  ) on conflict (storage_key) do update set approved = true
  returning id into v_video_id;

  insert into public.exercise_media_derivatives (
    asset_id, kind, storage_key, mime_type, bytes, width, height, codec, sha256, conversion, approved
  ) values (
    ${q(row.asset_id)}, 'poster_webp', ${q(posterKey)}, 'image/webp', ${Number(row.poster_bytes)}, 720, 720,
    'webp', ${q(row.poster_sha256)}, '{"source":"approved video derivative"}'::jsonb, true
  ) on conflict (storage_key) do update set approved = true
  returning id into v_poster_id;

  insert into public.exercise_media_links (
    asset_id, exercise_id, derivative_id, poster_derivative_id, media_role, precedence,
    mapping_review_state, technical_review_state, editorial_review_state,
    reviewer_reference, reviewed_at, review_notes, active
  ) values (
    ${q(row.asset_id)}, v_exercise_id, v_video_id, v_poster_id, ${q(row.media_role)}, 50,
    'approved', 'approved', 'approved', 'App 6D-2A reviewed candidate set', now(),
    'Four-frame visual review, technical validation, deterministic identity and purchased-rights provenance passed.', true
  ) on conflict (asset_id, exercise_id, media_role, version) do update set
    derivative_id = excluded.derivative_id,
    poster_derivative_id = excluded.poster_derivative_id,
    mapping_review_state = excluded.mapping_review_state,
    technical_review_state = excluded.technical_review_state,
    editorial_review_state = excluded.editorial_review_state,
    reviewed_at = excluded.reviewed_at,
    review_notes = excluded.review_notes,
    active = true,
    updated_at = now()
  returning id into v_link_id;

  if not exists (
    select 1 from public.exercise_media_review_events
    where link_id = v_link_id and evidence_reference = ${q(`docs/mobile/app6d2a/automation-continuation/FULL_ASSET_DISPOSITIONS.csv#${row.review_asset_id}`)}
  ) then
    insert into public.exercise_media_review_events (
      link_id, reviewer_reference, review_type, decision, notes, evidence_reference
    ) values (
      v_link_id, 'App 6D-2A reviewed candidate set', 'quality', 'approved',
      'Mapping, technical playback and editorial safety evidence approved for controlled rollout.',
      ${q(`docs/mobile/app6d2a/automation-continuation/FULL_ASSET_DISPOSITIONS.csv#${row.review_asset_id}`)}
    );
  end if;
end
$activation$;`;
});

const sql = `begin;\n${blocks.join("\n")}\ncommit;\n`;
await writeFile(outputPath, sql, "utf8");
console.log(JSON.stringify({ outputPath, rows: manifest.length }, null, 2));
