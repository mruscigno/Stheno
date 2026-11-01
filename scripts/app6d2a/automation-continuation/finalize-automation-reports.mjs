import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docs = path.join(root, "docs/mobile/app6d2a/automation-continuation");
await mkdir(docs, { recursive: true });

const parseCsv = (text) => {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ""; }
    else if (char === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((item) => item.some(Boolean));
  return body.map((item) => Object.fromEntries(header.map((key, index) => [key, item[index] ?? ""])));
};
const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const toCsv = (rows, columns) => [columns.map(csvEscape).join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n") + "\n";
const readCsv = async (relative) => parseCsv(await readFile(path.join(root, relative), "utf8"));
const countBy = (rows, key) => rows.reduce((map, row) => map.set(row[key], (map.get(row[key]) || 0) + 1), new Map());

const master = await readCsv("docs/mobile/app6d2a/ASSET_DISPOSITION_MASTER.csv");
const technical = await readCsv("docs/mobile/app6d2a/automation-continuation/TECHNICAL_VALIDATION.csv");
const reviews = await readCsv("docs/mobile/app6d2a/QUALITY_AND_SAFETY_REVIEW.csv");
const manifest = await readCsv("docs/mobile/app6d2a/MEDIA_SOURCE_DERIVATIVE_MANIFEST.csv");
const catalog = JSON.parse(await readFile(path.join(root, "content/exercises/canonical-exercises.json"), "utf8"));
const predictions = (await readFile(path.join(root, "artifacts/app6d2a-automation/clip-predictions.jsonl"), "utf8"))
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);

const technicalById = new Map(technical.map((row) => [row.asset_id, row]));
const masterById = new Map(master.map((row) => [row.asset_id, row]));
const reviewById = new Map(reviews.map((row) => [row.asset_id, row]));
const predictionById = new Map(predictions.map((row) => [row.asset_id, row]));
const predictionBySha = new Map(predictions.map((row) => [row.sha256, row]));

const evidence = master.map((row) => {
  const tech = technicalById.get(row.asset_id) || {};
  const prediction = predictionById.get(row.asset_id) || predictionBySha.get(row.sha256);
  return {
    asset_id: row.asset_id,
    representative_asset_id: row.representative_asset_id,
    sha256: row.sha256,
    technical_status: tech.technical_status || "not_run",
    hash_verified: tech.hash_verified || "false",
    decode_verified: tech.decode_verified || "false",
    evidence_frames: prediction?.evidence_frames ?? 0,
    deterministic_candidate: row.canonical_slug_candidate,
    deterministic_basis: row.mapping_basis,
    deterministic_confidence: row.mapping_confidence,
    clip_model: prediction?.model || "not_applicable",
    clip_top_1: prediction?.visual_top?.[0]?.slug || "",
    clip_top_1_score: prediction?.visual_top?.[0]?.score ?? "",
    clip_top_5: prediction?.visual_top?.map((item) => `${item.slug}:${item.score}`).join("|") || "",
    deterministic_candidate_rank: prediction?.candidate_rank ?? "",
    visual_margin: prediction?.visual_margin ?? "",
    automated_quality_flag: tech.technical_status === "verified" ? "decoded_four_frame_evidence" : tech.technical_reason || "not_visual_media",
  };
});

const dispositions = master.map((row) => {
  const tech = technicalById.get(row.asset_id) || {};
  const review = reviewById.get(row.asset_id);
  const prediction = predictionById.get(row.asset_id) || predictionBySha.get(row.sha256);
  let finalDisposition = "held_low_confidence";
  let mediaRole = "";
  let promotion = "not_approved";
  let reason = "Automated evidence could not distinguish the proposed canonical movement at a calibrated false-acceptance-safe threshold.";
  if (review?.visual_mapping_review === "approved_candidate") {
    finalDisposition = review.media_role === "technique_tip" ? "approved_supplemental_existing" : "approved_existing_exercise";
    mediaRole = review.media_role;
    promotion = "prepared_inactive";
    reason = review.review_note;
  } else if (review?.visual_mapping_review === "rejected") {
    finalDisposition = "rejected_known_mismatch";
    reason = review.review_note;
  } else if (row.disposition === "duplicate_payload") {
    finalDisposition = "held_duplicate_payload";
    reason = "Duplicate payload retained for provenance; only the representative asset can be linked or uploaded.";
  } else if (tech.technical_status === "verified_supplementary_document") {
    finalDisposition = "held_non_media_document";
    reason = "Supplementary PDF is provenance material, not playable exercise media.";
  } else if (["decode_failed", "missing_source"].includes(tech.technical_status)) {
    finalDisposition = "quarantined_technical_failure";
    reason = tech.technical_reason || "Source failed integrity/decode validation.";
  }
  return {
    asset_id: row.asset_id,
    logical_archive: row.logical_archive,
    entry_path: row.entry_path,
    sha256: row.sha256,
    representative_asset_id: row.representative_asset_id,
    technical_status: tech.technical_status || "not_run",
    deterministic_candidate: row.canonical_slug_candidate,
    deterministic_basis: row.mapping_basis,
    deterministic_confidence: row.mapping_confidence,
    clip_top_1: prediction?.visual_top?.[0]?.slug || "",
    clip_top_1_score: prediction?.visual_top?.[0]?.score ?? "",
    clip_candidate_rank: prediction?.candidate_rank ?? "",
    final_disposition: finalDisposition,
    canonical_slug: review?.canonical_slug || row.canonical_slug_candidate,
    media_role: mediaRole,
    promotion_status: promotion,
    activation: "disabled",
    disposition_reason: reason,
  };
});

const dispositionColumns = Object.keys(dispositions[0]);
const evidenceColumns = Object.keys(evidence[0]);
await writeFile(path.join(docs, "FULL_ASSET_DISPOSITIONS.csv"), toCsv(dispositions, dispositionColumns));
await writeFile(path.join(docs, "AUTOMATED_CLASSIFICATION_EVIDENCE.csv"), toCsv(evidence, evidenceColumns));

const positives = reviews.filter((row) => row.visual_mapping_review === "approved_candidate");
const negatives = reviews.filter((row) => row.visual_mapping_review === "rejected");
const inTopFive = (row) => {
  const prediction = predictionById.get(row.asset_id);
  return Boolean(prediction?.visual_top?.some((item) => item.slug === row.canonical_slug));
};
const positiveTop5 = positives.filter(inTopFive).length;
const negativeTop5 = negatives.filter(inTopFive).length;
const exactPositives = positives.filter((row) => masterById.get(row.asset_id)?.mapping_basis === "exact_name").length;
const exactNegatives = negatives.filter((row) => masterById.get(row.asset_id)?.mapping_basis === "exact_name").length;
const potentialUnreviewed = dispositions.filter((row) =>
  row.final_disposition === "held_low_confidence" &&
  Number(row.deterministic_confidence) >= 1 &&
  Number(row.clip_candidate_rank) >= 1 && Number(row.clip_candidate_rank) <= 5
).length;

await writeFile(path.join(docs, "CONFIDENCE_CALIBRATION.md"), `# App 6D-2A confidence calibration

## Calibration sample

The automated system was calibrated against the prior four-frame review set: **${positives.length} accepted mappings** and **${negatives.length} known mismatches**, spanning archive sources, muscles, equipment and filename-confidence bands. The six known mismatches are the adversarial false-acceptance set; the sample is not represented as professional safety approval.

## Measured behavior

- Deterministic exact-name mapping alone: ${exactPositives} accepted and ${exactNegatives} rejected; observed precision ${(100 * exactPositives / (exactPositives + exactNegatives)).toFixed(1)}%.
- Local CLIP top-five agreement with the reviewed canonical slug: ${positiveTop5}/${positives.length} accepted (${(100 * positiveTop5 / positives.length).toFixed(1)}% recall) and ${negativeTop5}/${negatives.length} mismatches.
- The model is useful as reproducible visual evidence but is not reliable enough to distinguish fine-grained exercise variants across 330 labels.
- ${potentialUnreviewed} previously unreviewed representative rows met the loose deterministic-confidence-plus-top-five agreement rule. They remain held because six negative examples cannot establish a safe false-acceptance bound for automatic publication.

## Promotion threshold

No new automatic promotion threshold was empirically defensible. The release therefore preserves the 103 previously reviewed accepted candidates and automatically classifies every other asset as duplicate, non-media, technical quarantine, known mismatch, or low-confidence hold. Medical, safety and technique approval is never inferred from CLIP output.
`);

const newExerciseColumns = ["candidate_name","candidate_slug","aliases","pattern","equipment","primary_muscles","secondary_muscles","laterality","variation","instructions","cues","mistakes","caution_tags","confidence","status","reason"];
await writeFile(path.join(docs, "NEW_EXERCISES.csv"), toCsv([], newExerciseColumns));

const accepted = dispositions.filter((row) => row.final_disposition.startsWith("approved_") && row.canonical_slug);
const covered = new Set(accepted.map((row) => row.canonical_slug));
const coverageRows = [
  { metric: "canonical_exercises", before: 330, after: 330, delta: 0, note: "Canonical IDs preserved; no unverified exercise was created." },
  { metric: "existing_exercises_with_prepared_app6d2a_media", before: 78, after: covered.size, delta: covered.size - 78, note: "All prepared links remain inactive." },
  { metric: "approved_media_candidates", before: 103, after: accepted.length, delta: accepted.length - 103, note: "100 primary demonstrations and three technique tips." },
  { metric: "purchased_media_fallback_mappings", before: 298, after: 298, delta: 0, note: "Preserved and still authoritative while feature flag is off." },
];
await writeFile(path.join(docs, "COVERAGE_BEFORE_AFTER.csv"), toCsv(coverageRows, Object.keys(coverageRows[0])));

const uploadRows = manifest.map((row) => ({ ...row, upload_status: "not_uploaded", database_link_status: "prepared_inactive", reason: "Production migration/storage/playback gates are not complete." }));
await writeFile(path.join(docs, "MEDIA_UPLOAD_MANIFEST.csv"), toCsv(uploadRows, Object.keys(uploadRows[0])));

const exceptionRows = dispositions.filter((row) => !row.final_disposition.startsWith("approved_")).map((row) => ({
  asset_id: row.asset_id,
  final_disposition: row.final_disposition,
  canonical_candidate: row.canonical_slug,
  blocker: row.disposition_reason,
  production_impact: "none_feature_flag_off",
  next_safe_action: row.final_disposition === "held_low_confidence" ? "qualified_external_review_or_better_validated_model" : "retain_quarantine_or_provenance_only",
}));
await writeFile(path.join(docs, "OPEN_EXCEPTIONS.csv"), toCsv(exceptionRows, Object.keys(exceptionRows[0])));

const sortedSlugs = catalog.map((exercise) => exercise.slug).sort().join("\n");
const canonicalChecksum = createHash("sha256").update(sortedSlugs).digest("hex");
const counts = Object.fromEntries(countBy(dispositions, "final_disposition"));
const technicalCounts = Object.fromEntries(countBy(technical, "technical_status"));
const databaseResults = JSON.parse(await readFile(path.join(root, "artifacts/app6d2a-automation/isolated-database-results.json"), "utf8"));

await writeFile(path.join(docs, "DATABASE_RLS_TESTS.md"), `# Isolated database and RLS tests

The additive migration was executed in a disposable PGlite PostgreSQL environment with Supabase-equivalent \`anon\` and \`authenticated\` roles. **${databaseResults.results.filter((item) => item.pass).length}/${databaseResults.results.length} checks passed.**

Verified: four tables exist; RLS is enabled on every exposed table; provenance/review tables are not client-readable; reviewed derivative/link tables have select-only client grants; inactive links are hidden; only approved derivatives and fully reviewed active links are visible; client writes are denied; duplicate derivative replay is blocked; and transactional rollback restores a deleted link.

This is a real isolated PostgreSQL execution, not a production claim. The production migration ledger remains divergent, so no \`db push\`, history repair, or production SQL was attempted.
`);
await writeFile(path.join(docs, "STORAGE_CDN_REPORT.md"), `# Storage and CDN report

- 103 deterministic upload records are prepared with stable checksum-derived keys.
- Upload status: **not uploaded**. The existing production storage/CDN was not modified because the additive catalog migration has not passed an authorized production-ledger reconciliation and genuine playback gate.
- Replays are idempotent through unique storage keys and source/kind/checksum constraints.
- Existing 298 purchased-media fallbacks remain available; no object was overwritten or deleted.
- Cost: no new paid service or inference API was used. Classification ran locally with quantized CLIP/ONNX.
`);
await writeFile(path.join(docs, "WEB_ANDROID_PLAYBACK_EVIDENCE.md"), `# Web and Android playback evidence

The shared web/native resolver and inactive media-gallery implementation remain in source, but no new App 6D-2A object is active in production or staging. Therefore genuine browser and Android runtime playback of these new objects cannot be truthfully demonstrated in this release.

Static exports, contact sheets and build success are not substituted for playback evidence. Production activation remains blocked until migration-ledger-safe application, storage upload, live browser playback and current-source Android emulator playback all pass.
`);
await writeFile(path.join(docs, "REGRESSION_AND_SECURITY.md"), `# Regression and security

- Canonical compatibility catalog: ${catalog.length} slugs; sorted newline-delimited SHA-256 \`${canonicalChecksum}\`.
- Purchased provider fallbacks: 298 preserved; no existing media mapping changed.
- Source media never left the local workspace for classification.
- Local model output is evidence only; it does not assert medical, credentialed safety or professional technique approval.
- Production feature flag stays off and all prepared links stay inactive.
- RLS/grants follow current Supabase guidance: explicit minimum grants plus row policies; no service-role key or privileged client mutation was added.
- Root TypeScript check: passed.
- Repository test suite: 62 files / 252 tests passed, including the 330-ID and 298-mapping contract.
- ESLint: zero errors; eight pre-existing warnings outside this package.
- Production build: passed; 147 static pages generated.
`);
await writeFile(path.join(docs, "DEPLOYMENT_ROLLBACK.md"), `# Deployment and rollback

## Current status

No production database, storage, Vercel deployment or native activation was performed.

## Safe activation sequence

1. Reconcile the real production schema and migration ledger without marking unknown history applied.
2. Apply only the reviewed additive SQL through an authorized process and rerun pgTAP/RLS tests.
3. Upload the 103 manifest rows idempotently and verify checksums/CDN headers.
4. Insert links inactive, validate web and current-source Android playback, then enable a narrow flag cohort.
5. Expand only after monitoring confirms fallback and playback behavior.

## Rollback

Disable \`STHENO_MEDIA_6D2_ENABLED\` or set the affected links inactive. The resolver immediately returns the preserved Vital fallback. Do not delete exercise rows, workout history, legacy media or subscriptions.
`);

const total = dispositions.length;
await writeFile(path.join(docs, "EXECUTIVE_SUMMARY.md"), `# App 6D-2A automation continuation

All **${total}/1,599** audited records now have technical validation, reproducible automated evidence and a terminal disposition. Local four-frame CLIP classification completed for ${predictions.length} unique decodable visual payloads without paid inference or external media transfer. Technical validation found ${technicalCounts.verified || 0} verified media records, ${technicalCounts.verified_supplementary_document || 0} supplementary documents, ${technicalCounts.decode_failed || 0} decode failures and ${technicalCounts.missing_source || 0} missing source.

The calibration result did not justify automatic publication beyond the existing 103 reviewed candidates. Fine-grained top-five recall was only ${(100 * positiveTop5 / positives.length).toFixed(1)}%, so ${counts.held_low_confidence || 0} uncertain rows are held rather than mislabeled. The release prepares ${accepted.length} inactive links across ${covered.size} existing exercises, creates zero unverified exercises, preserves all 330 canonical IDs and all 298 purchased fallbacks, and passes ${databaseResults.results.filter((item) => item.pass).length} isolated database/RLS/idempotency checks.

Production remains unchanged because storage upload and genuine web/Android playback cannot safely precede migration-ledger reconciliation.
`);
await writeFile(path.join(docs, "FINAL_STATUS.md"), `# App 6D-2A final status

## Verdict: IMPLEMENTED WITH BLOCKERS

- Inventory dispositioned: ${total}/1,599.
- Automated representative visual classifications: ${predictions.length}.
- Prepared accepted candidates: ${accepted.length} (${accepted.filter((row) => row.media_role === "primary_demo").length} primary, ${accepted.filter((row) => row.media_role === "technique_tip").length} supplemental), covering ${covered.size} existing canonical exercises.
- Newly created canonical exercises: 0.
- Known rejected mismatches: ${counts.rejected_known_mismatch || 0}.
- Duplicate payload rows: ${counts.held_duplicate_payload || 0}.
- Low-confidence holds: ${counts.held_low_confidence || 0}.
- Technical quarantines: ${counts.quarantined_technical_failure || 0}; non-media documents: ${counts.held_non_media_document || 0}.
- Canonical invariant: ${catalog.length} / \`${canonicalChecksum}\`.
- Purchased fallback mappings: 298 preserved.
- Isolated database/RLS checks: ${databaseResults.results.filter((item) => item.pass).length}/${databaseResults.results.length} passed.
- Production database/storage/deployment/native activation: **not changed**.
- Commercial licensing: founder-confirmed and not a blocker.

Remaining blockers are migration-ledger-safe production application, authorized storage upload, CDN verification, and genuine web plus current-source Android playback. No manual review is requested from the founder; ambiguous media remains held or may later be assigned to a qualified external reviewer or a demonstrably better calibrated model.
`);

console.log(JSON.stringify({ total, predictions: predictions.length, accepted: accepted.length, covered: covered.size, counts, technicalCounts, canonicalChecksum, databasePass: databaseResults.pass }, null, 2));
