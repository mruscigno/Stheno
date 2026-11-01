import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseCsv(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { value += '"'; index++; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(value); value = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(value); value = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else value += character;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const [headers, ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

const root = process.cwd();
const docs = path.join(root, "docs", "mobile", "app6d2");
const manifest = parseCsv(await readFile(path.join(docs, "SOURCE_AND_DERIVATIVE_MANIFEST.csv"), "utf8"));
const mappings = new Map(parseCsv(await readFile(path.join(docs, "CANONICAL_MAPPING_AND_NEW_EXERCISES.csv"), "utf8")).map((row) => [row.asset_id, row]));
const plan = manifest.map((row) => ({
  idempotencyKey: `${row.asset_id}:${row.canonical_slug}:primary_demo:1`,
  asset: {
    id: row.asset_id,
    sha256: row.source_sha256,
    sourceCollection: "founder-confirmed-commercial-license",
    originalBytes: Number(row.source_bytes),
    licenseReference: "founder-confirmation-2026-11-01",
    reviewState: "pending",
  },
  video: { storageKey: row.storage_key, sha256: row.video_sha256, bytes: Number(row.video_bytes), approved: false },
  poster: { storageKey: row.poster_storage_key, sha256: row.poster_sha256, bytes: Number(row.poster_bytes), approved: false },
  link: {
    canonicalSlug: row.canonical_slug,
    role: "primary_demo",
    mappingReviewState: mappings.get(row.review_asset_id)?.mapping_decision === "existing_exercise_upgrade" ? "approved" : "rejected",
    technicalReviewState: "pending",
    editorialReviewState: "pending",
    active: false,
    featureFlag: "exercise_media_6d2",
    version: 1,
  },
}));

const apply = (rows) => {
  const state = new Map();
  for (const row of rows) state.set(row.idempotencyKey, row);
  return state;
};
const first = apply(plan);
const replay = apply([...first.values(), ...plan]);
if (first.size !== plan.length || replay.size !== plan.length) throw new Error("Idempotency replay generated duplicate rows");
const digest = createHash("sha256").update(JSON.stringify(plan)).digest("hex");
await writeFile(path.join(docs, "import-plan.json"), `${JSON.stringify({ version: 1, featureFlag: "exercise_media_6d2", active: false, count: plan.length, digest, rows: plan }, null, 2)}\n`);
console.log(`Dry-run plan contains ${plan.length} disabled links; replay count ${replay.size}; digest ${digest}.`);
