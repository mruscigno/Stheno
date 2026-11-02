import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile("supabase/migrations/20261102160911_app6d2a_zero_cost_outbox_scheduler.sql", "utf8");
const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
const route = await readFile("src/app/api/cron/workout-outbox/route.ts", "utf8");
const worker = await readFile("src/platform/server/workout-outbox.ts", "utf8");
const durableMigration = await readFile("supabase/migrations/20261021154945_app5b1r_durable_outbox.sql", "utf8");

assert.match(migration, /create extension if not exists pg_cron/);
assert.match(migration, /create extension if not exists pg_net/);
assert.match(migration, /vault\.decrypted_secrets/);
assert.doesNotMatch(migration, /Bearer\s+[A-Za-z0-9_-]{16,}/);
assert.match(migration, /revoke all on schema private from public, anon, authenticated/);
assert.match(migration, /revoke all on function private\.enqueue_workout_outbox_run\(\) from public, anon, authenticated/);
assert.match(route, /authorization.*Bearer \$\{process\.env\.CRON_SECRET\}/s);
assert.match(worker, /claim_workout_outbox/);
assert.match(durableMigration, /for update skip locked/i);
assert.match(durableMigration, /lease_expires_at/);
assert.equal(vercel.crons.some((job) => job.path === "/api/cron/workout-outbox"), false);
assert.equal(vercel.crons.some((job) => job.path === "/api/cron/activity-reminders"), true);

console.log(JSON.stringify({ pass: true, checks: 12 }));
