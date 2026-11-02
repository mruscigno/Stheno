import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ""; }
    else if (c === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...data] = rows.filter((candidate) => candidate.some(Boolean));
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csv(rows) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n") + "\n";
}

const replacements = new Map([
  ["db", "dumbbell"], ["bb", "barbell"], ["kb", "kettlebell"], ["sm", "smith"],
  ["pulldowns", "pulldown"], ["pushdowns", "pushdown"], ["extensions", "extension"],
  ["curls", "curl"], ["raises", "raise"], ["presses", "press"], ["rows", "row"],
  ["squats", "squat"], ["lunges", "lunge"], ["flyes", "fly"], ["flies", "fly"],
]);

function normalize(value) {
  return value
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, "").replace(/\(\d+\)/g, " ")
    .replace(/\b(exercise|animation|animated|demo|male|female)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/)
    .map((token) => replacements.get(token) ?? token).join(" ");
}

function labelFromEntry(entry) {
  const base = entry.replaceAll("\\", "/").split("/").pop() ?? entry;
  return base.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)\s*$/, "");
}

function score(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aa = new Set(a.split(" ")), bb = new Set(b.split(" "));
  const intersection = [...aa].filter((token) => bb.has(token)).length;
  const union = new Set([...aa, ...bb]).size;
  const jaccard = intersection / union;
  const containment = intersection / Math.min(aa.size, bb.size);
  return Math.max(jaccard, containment * 0.92);
}

const dispositionRows = parseCsv(await readFile(path.join(root, "docs/mobile/app6d2a/automation-continuation/FULL_ASSET_DISPOSITIONS.csv"), "utf8"));
const production = JSON.parse(await readFile(path.join(root, "artifacts/app6d2a-private/production-taxonomy.json"), "utf8")).rows.map((row) => row.exercise);
const labels = production.flatMap((exercise) => {
  const aliases = Array.isArray(exercise.aliases) ? exercise.aliases : [];
  return [exercise.name, exercise.slug.replaceAll("-", " "), ...aliases].filter(Boolean).map((label) => ({ exercise, label, normalized: normalize(label) }));
});

const output = dispositionRows.filter((row) => row.final_disposition === "held_low_confidence").map((row) => {
  const sourceLabel = labelFromEntry(row.entry_path);
  const normalized = normalize(sourceLabel);
  const ranked = labels.map((candidate) => ({ ...candidate, score: score(normalized, candidate.normalized) })).sort((a, b) => b.score - a.score);
  const best = ranked[0], second = ranked.find((candidate) => candidate.exercise.id !== best.exercise.id);
  const margin = best.score - (second?.score ?? 0);
  const exact = best.score === 1;
  const recommendation = exact ? "existing_exact_taxonomy_match" : best.score >= 0.92 && margin >= 0.08 ? "existing_high_precision_alias_match" : best.score >= 0.78 ? "needs_visual_disambiguation" : "new_taxonomy_candidate";
  return {
    asset_id: row.asset_id,
    entry_path: row.entry_path,
    source_label: sourceLabel,
    normalized_source_label: normalized,
    production_slug: best.exercise.slug,
    production_name: best.exercise.name,
    production_equipment: (best.exercise.equipment ?? []).join("|"),
    production_movement_pattern: best.exercise.movement_pattern ?? "",
    match_score: best.score.toFixed(3),
    runner_up_slug: second?.exercise.slug ?? "",
    runner_up_score: (second?.score ?? 0).toFixed(3),
    margin: margin.toFixed(3),
    recommendation,
    specific_reason: exact
      ? "The purchased filename exactly matches a current production exercise name, slug, or alias after singularization and equipment normalization."
      : recommendation === "existing_high_precision_alias_match"
        ? "The purchased filename has a unique high-precision production taxonomy match with a safe runner-up margin."
        : recommendation === "needs_visual_disambiguation"
          ? "The production taxonomy contains multiple nearby movement or equipment variants; multi-frame visual review must resolve the variant."
          : "No sufficiently similar production exercise name or alias exists; treat as a proposed new taxonomy record pending visual and coaching review.",
  };
});

await writeFile(path.join(root, "docs/mobile/app6d2a/automation-continuation/PRODUCTION_TAXONOMY_REMATCH.csv"), csv(output), "utf8");
const counts = Object.fromEntries([...new Set(output.map((row) => row.recommendation))].sort().map((key) => [key, output.filter((row) => row.recommendation === key).length]));
await writeFile(path.join(root, "docs/mobile/app6d2a/automation-continuation/PRODUCTION_TAXONOMY_REMATCH_SUMMARY.json"), JSON.stringify({ productionExerciseCount: production.length, heldAssetCount: output.length, counts }, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ productionExerciseCount: production.length, heldAssetCount: output.length, counts }, null, 2));
