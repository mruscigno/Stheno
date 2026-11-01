import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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

function csv(rows, columns) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return `${columns.map(escape).join(",")}\n${rows.map((row) => columns.map((column) => escape(row[column])).join(",")).join("\n")}\n`;
}

const root = process.cwd();
const inventoryPath = path.join(root, "docs/mobile/app6d1/asset_inventory.csv");
const reviewedPath = path.join(root, "docs/mobile/app6d2/MEDIA_REVIEW_RESULTS.csv");
const output = path.join(root, "docs/mobile/app6d2a");
await mkdir(output, { recursive: true });

const inventory = parseCsv(await readFile(inventoryPath, "utf8"));
const reviewed = new Map(parseCsv(await readFile(reviewedPath, "utf8")).map((row) => [row.asset_id, row]));
const shaGroups = new Map();
for (const row of inventory) {
  if (!row.sha256) continue;
  const group = shaGroups.get(row.sha256) ?? [];
  group.push(row);
  shaGroups.set(row.sha256, group);
}

const representativeBySha = new Map();
for (const [sha256, rows] of shaGroups) {
  const accepted = rows.find((row) => reviewed.get(row.asset_id)?.visual_mapping_review === "approved_candidate");
  representativeBySha.set(sha256, accepted?.asset_id ?? rows[0].asset_id);
}

const knownMismatch = "asset-0848";
const master = inventory.map((row) => {
  const prior = reviewed.get(row.asset_id);
  const representative = row.sha256 ? representativeBySha.get(row.sha256) : "";
  let disposition = "pending_manual_review";
  let reason = "Filename and automated similarity are insufficient for approval; explicit visual review remains required.";
  if (row.source_status === "missing" || row.recommendation === "BLOCKED_SOURCE") {
    disposition = "blocked_source";
    reason = "Source was absent during the App 6D-1 audit.";
  } else if (row.asset_id === knownMismatch || prior?.visual_mapping_review === "rejected") {
    disposition = "rejected_mismatch";
    reason = prior?.review_note || "Known visual mismatch.";
  } else if (prior?.visual_mapping_review === "approved_candidate") {
    disposition = "accepted_existing_exercise_candidate";
    reason = "App 6D-2 four-frame visual review supports the existing canonical mapping; activation remains disabled.";
  } else if (representative && representative !== row.asset_id) {
    disposition = "duplicate_payload";
    reason = `Byte-identical SHA-256 payload; representative ${representative}.`;
  } else if (row.mapping_basis === "exact_name" || row.mapping_basis === "high_name_similarity") {
    disposition = "pending_visual_review_priority";
    reason = "Automated name match qualifies for the next visual-review batch but is not an approval.";
  }
  return {
    asset_id: row.asset_id,
    logical_archive: row.logical_archive,
    entry_path: row.entry_path,
    sha256: row.sha256,
    source_status: row.source_status,
    canonical_slug_candidate: row.proposed_canonical_slug,
    mapping_basis: row.mapping_basis,
    mapping_confidence: row.mapping_confidence,
    representative_asset_id: representative,
    disposition,
    disposition_reason: reason,
    activation: "disabled",
  };
});

const candidates = master
  .filter((row) => row.disposition === "pending_visual_review_priority" && row.canonical_slug_candidate)
  .sort((left, right) => Number(right.mapping_confidence) - Number(left.mapping_confidence) || left.asset_id.localeCompare(right.asset_id));
const queue = master.filter((row) => row.disposition.startsWith("pending_"));
const counts = Object.fromEntries([...new Set(master.map((row) => row.disposition))].sort().map((status) => [status, master.filter((row) => row.disposition === status).length]));
const digest = createHash("sha256").update(JSON.stringify(master)).digest("hex");

const masterColumns = ["asset_id","logical_archive","entry_path","sha256","source_status","canonical_slug_candidate","mapping_basis","mapping_confidence","representative_asset_id","disposition","disposition_reason","activation"];
await writeFile(path.join(output, "ASSET_DISPOSITION_MASTER.csv"), csv(master, masterColumns));
await writeFile(path.join(output, "BATCH_2_CANDIDATES.csv"), csv(candidates, masterColumns));
await writeFile(path.join(output, "NEXT_UNREVIEWED_QUEUE.csv"), csv(queue, masterColumns));
await writeFile(path.join(output, "disposition-summary.json"), `${JSON.stringify({ version: 1, inventoryRows: inventory.length, digest, counts, nextVisualReviewCandidates: candidates.length, pendingQueue: queue.length }, null, 2)}\n`);
console.log(JSON.stringify({ inventoryRows: inventory.length, digest, counts, nextVisualReviewCandidates: candidates.length, pendingQueue: queue.length }, null, 2));
