import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "../../../artifacts/app6d2a-pglite-runtime/node_modules/@electric-sql/pglite/dist/index.js";

const root = process.cwd();
const reportDir = path.join(root, "artifacts/app6d2a-automation");
await mkdir(reportDir, { recursive: true });
const db = new PGlite();
const results = [];

const check = async (name, query, expected) => {
  try {
    const response = await db.query(query);
    const actual = response.rows[0]?.value;
    const pass = actual === expected;
    results.push({ name, pass, expected, actual });
    if (!pass) throw new Error(`${name}: expected ${expected}, received ${actual}`);
  } catch (error) {
    results.push({ name, pass: false, expected, actual: null, error: String(error.message || error) });
    throw error;
  }
};

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create table public.exercises(id uuid primary key default gen_random_uuid(), slug text not null unique);
    insert into public.exercises(slug) values ('barbell-bench-press');
  `);

  const migration = await readFile(path.join(root, "supabase/migrations/20261101143058_app6d2_media_catalog.sql"), "utf8");
  await db.exec(migration);

  for (const table of ["exercise_media_assets", "exercise_media_derivatives", "exercise_media_links", "exercise_media_review_events"]) {
    await check(`${table} exists`, `select to_regclass('public.${table}') is not null as value`, true);
    await check(`${table} RLS enabled`, `select relrowsecurity as value from pg_class where oid='public.${table}'::regclass`, true);
  }
  await check("anon cannot read provenance", `select not has_table_privilege('anon','public.exercise_media_assets','select') as value`, true);
  await check("authenticated cannot read provenance", `select not has_table_privilege('authenticated','public.exercise_media_assets','select') as value`, true);
  await check("anon cannot read review audit", `select not has_table_privilege('anon','public.exercise_media_review_events','select') as value`, true);
  await check("authenticated cannot read review audit", `select not has_table_privilege('authenticated','public.exercise_media_review_events','select') as value`, true);
  await check("anon can select reviewed derivatives subject to RLS", `select has_table_privilege('anon','public.exercise_media_derivatives','select') as value`, true);
  await check("authenticated can select reviewed links subject to RLS", `select has_table_privilege('authenticated','public.exercise_media_links','select') as value`, true);
  await check("anon cannot insert links", `select not has_table_privilege('anon','public.exercise_media_links','insert') as value`, true);
  await check("authenticated cannot update links", `select not has_table_privilege('authenticated','public.exercise_media_links','update') as value`, true);

  const sha = "a".repeat(64);
  await db.exec(`
    insert into public.exercise_media_assets(id,sha256,source_collection,source_entry,original_mime,original_bytes,license_reference,review_state)
      values ('sha256:${sha}:source-a','${sha}','collection-a','entry-a.gif','image/gif',1024,'commercial-license-confirmed','approved');
    insert into public.exercise_media_derivatives(asset_id,kind,storage_key,mime_type,bytes,width,height,sha256,approved)
      values ('sha256:${sha}:source-a','video_mp4','app6d2/${sha}.mp4','video/mp4',512,640,640,'${sha}',true);
    insert into public.exercise_media_links(asset_id,exercise_id,derivative_id,media_role,mapping_review_state,technical_review_state,editorial_review_state,active)
      select 'sha256:${sha}:source-a',e.id,d.id,'primary_demo','approved','approved','approved',false
      from public.exercises e cross join public.exercise_media_derivatives d where e.slug='barbell-bench-press';
  `);
  await check("new links default inactive", `select not active as value from public.exercise_media_links limit 1`, true);

  let duplicateBlocked = false;
  try {
    await db.exec(`insert into public.exercise_media_derivatives(asset_id,kind,storage_key,mime_type,bytes,width,height,sha256,approved)
      values ('sha256:${sha}:source-a','video_mp4','app6d2/${sha}.mp4','video/mp4',512,640,640,'${sha}',true)`);
  } catch { duplicateBlocked = true; }
  results.push({ name: "duplicate derivative replay blocked", pass: duplicateBlocked, expected: true, actual: duplicateBlocked });

  await db.exec("begin; delete from public.exercise_media_links; rollback;");
  await check("transaction rollback restores media link", `select count(*)::int = 1 as value from public.exercise_media_links`, true);

  await db.exec("set role anon");
  await check("inactive link hidden by RLS", `select count(*)::int = 0 as value from public.exercise_media_links`, true);
  await check("approved derivative visible by RLS", `select count(*)::int = 1 as value from public.exercise_media_derivatives`, true);
  await db.exec("reset role");

  await db.exec("update public.exercise_media_links set active=true");
  await db.exec("set role anon");
  await check("fully reviewed active link visible by RLS", `select count(*)::int = 1 as value from public.exercise_media_links`, true);
  await db.exec("reset role");
} catch (error) {
  results.push({ name: "isolated suite completion", pass: false, error: String(error.stack || error) });
} finally {
  await db.close();
}

const pass = results.every((result) => result.pass);
await writeFile(path.join(reportDir, "isolated-database-results.json"), JSON.stringify({ pass, engine: "PGlite isolated PostgreSQL", results }, null, 2));
console.log(JSON.stringify({ pass, checks: results.length, failed: results.filter((result) => !result.pass).map((result) => result.name) }, null, 2));
process.exitCode = pass ? 0 : 1;
