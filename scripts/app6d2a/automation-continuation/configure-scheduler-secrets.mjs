import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const privateDir = path.join(root, "artifacts/app6d2a-private");
const sqlPath = path.join(privateDir, "configure-scheduler-secrets.sql");
const secret = randomBytes(48).toString("base64url");

function run(command, args, options = {}) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", shell: false, ...options });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
}

await mkdir(privateDir, { recursive: true });
run("npx", ["vercel", "env", "add", "CRON_SECRET", "--environment", "production,preview", "--sensitive", "--yes", "--force"], { input: `${secret}\n` });

const escaped = secret.replaceAll("'", "''");
await writeFile(sqlPath, `do $$
declare existing uuid;
begin
  select id into existing from vault.secrets where name = 'workout_outbox_cron_secret';
  if existing is null then
    perform vault.create_secret('${escaped}', 'workout_outbox_cron_secret', 'Rotated App 6D-2A scheduler credential');
  else
    perform vault.update_secret(existing, '${escaped}', 'workout_outbox_cron_secret', 'Rotated App 6D-2A scheduler credential');
  end if;
  select id into existing from vault.secrets where name = 'workout_outbox_endpoint';
  if existing is null then
    perform vault.create_secret('https://www.sthenofitness.com/api/cron/workout-outbox', 'workout_outbox_endpoint', 'Production workout outbox endpoint');
  else
    perform vault.update_secret(existing, 'https://www.sthenofitness.com/api/cron/workout-outbox', 'workout_outbox_endpoint', 'Production workout outbox endpoint');
  end if;
end $$;`, { encoding: "utf8", mode: 0o600 });

try {
  run("npx", ["supabase", "db", "query", "--remote", "--file", sqlPath, "--yes", "--output", "json"]);
} finally {
  await rm(sqlPath, { force: true });
}

console.log(JSON.stringify({ vercelSecretRotated: true, vaultSecretStored: true, secretLength: secret.length }));
