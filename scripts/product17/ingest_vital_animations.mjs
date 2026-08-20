import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const providerRoot = path.resolve(process.argv[2] ?? path.join(ROOT, "..", "work", "vital-animations"));
const catalog = JSON.parse(await readFile(path.join(ROOT, "content", "exercises", "canonical-exercises.json"), "utf8"));
const collections = [
  { name: "100-gym-workouts", json: "100 Gym Workouts/100gymworkouts.json", videos: "100 Gym Workouts/100gymworkouts" },
  { name: "100-workouts", json: "100 Workouts/100workouts.json", videos: "100 Workouts/100 Workouts" },
  { name: "200-workouts", json: "200 Workouts/200workouts.json", videos: "200 Workouts/200 Workouts" },
];

const substitutions = new Map([
  ["romanian deadlift", "rdl"], ["stiff leg deadlift", "rdl"], ["bent over", "bentover"],
  ["one arm", "single arm"], ["one leg", "single leg"], ["pull up", "pullup"], ["push up", "pushup"],
  ["lat pull down", "lat pulldown"], ["tricep", "triceps"], ["bicep", "biceps"], ["rear lateral raise", "rear delt raise"],
]);
const noise = new Set(["exercise", "workout", "machine", "bodyweight", "body", "weight", "with", "the"]);
const normalize = (value) => {
  let text = String(value ?? "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
  for (const [from, to] of substitutions) text = text.replaceAll(from, to);
  return text.split(/\s+/).filter((token) => token && !noise.has(token)).join(" ");
};
const normalizeMetadata = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value) => new Set(normalize(value).split(" ").filter(Boolean));
const overlap = (left, right) => {
  const a = tokens(left), b = tokens(right), common = [...a].filter((token) => b.has(token)).length;
  return common / Math.max(1, a.size + b.size - common);
};
const equipmentAliases = {
  dumbbells: ["dumbbell"], barbell: ["barbell", "olympic barbell", "ez barbell"], cables: ["cable"],
  machines: ["leverage machine", "sled machine", "assisted", "smith machine", "machine"],
  bodyweight: ["body weight", "assisted"], bands: ["band", "resistance band"], bench: ["bench"],
};
const muscleAliases = {
  back: ["lats", "traps", "upper back", "erector spinae", "rhomboids"], chest: ["pectorals", "chest"],
  shoulders: ["delts", "deltoids", "anterior deltoid", "rear deltoids"], quadriceps: ["quads", "quadriceps"],
  glutes: ["glutes", "gluteus maximus", "gluteus medius"], hamstrings: ["hamstrings"], calves: ["calves"],
  biceps: ["biceps"], triceps: ["triceps"], core: ["abs", "obliques", "rectus abdominis"],
};
const equipmentCompatible = (exercise, provider) => exercise.requiredEquipment.some((item) => (equipmentAliases[item] ?? [item]).map(normalizeMetadata).includes(normalizeMetadata(provider.equipment)));
const muscleCompatible = (exercise, provider) => exercise.primaryMuscles.some((item) => (muscleAliases[item] ?? [item]).some((alias) => normalize(provider.target).includes(normalize(alias)) || provider.secondaryMuscles.some((muscle) => normalize(muscle).includes(normalize(alias)))));

const providers = [];
for (const collection of collections) {
  const records = JSON.parse(await readFile(path.join(providerRoot, collection.json), "utf8"));
  for (const [index, sourceRecord] of records.entries()) {
    const inferredId = String(index + 1).padStart(4, "0");
    const record = { ...sourceRecord, id: sourceRecord.id || inferredId };
    const sourcePath = path.join(providerRoot, collection.videos, `${record.id}.mp4`);
    await stat(sourcePath);
    providers.push({ ...record, collection: collection.name, providerKey: `${collection.name}:${record.id}`, sourcePath });
  }
}

const proposed = catalog.map((exercise) => {
  const ranked = providers.map((provider) => {
    const nameScore = overlap(exercise.name, provider.name);
    const exact = normalize(exercise.name) === normalize(provider.name) || nameScore === 1;
    const equipment = equipmentCompatible(exercise, provider);
    const muscle = muscleCompatible(exercise, provider);
    const confidence = Math.min(1, nameScore * 0.72 + (equipment ? 0.14 : 0) + (muscle ? 0.14 : 0));
    return { provider, exact, equipment, muscle, confidence };
  }).sort((a, b) => b.confidence - a.confidence);
  const [best, second] = ranked;
  const safeExact = best.exact && best.equipment && best.muscle;
  const safeStructured = best.confidence >= 0.91 && best.equipment && best.muscle && best.confidence - second.confidence >= 0.08;
  return { exercise, best, second, autoCandidate: safeExact || safeStructured };
});

// One provider animation may represent only one canonical exercise. Resolve collisions by confidence.
const claims = new Map();
for (const item of proposed.filter((item) => item.autoCandidate).sort((a, b) => b.best.confidence - a.best.confidence)) {
  if (!claims.has(item.best.provider.providerKey)) claims.set(item.best.provider.providerKey, item.exercise.slug);
}

const importedAt = new Date().toISOString();
const rows = proposed.map(({ exercise, best, second, autoCandidate }) => {
  const accepted = autoCandidate && claims.get(best.provider.providerKey) === exercise.slug;
  const ambiguous = !accepted && best.confidence >= 0.58;
  return {
    sthenoId: exercise.slug,
    sthenoName: exercise.name,
    status: accepted ? "AUTO_MATCH" : ambiguous ? "AMBIGUOUS" : "UNMATCHED",
    externalId: accepted || ambiguous ? best.provider.providerKey : null,
    externalName: accepted || ambiguous ? best.provider.name : null,
    confidence: Number(best.confidence.toFixed(4)),
    runnerUp: ambiguous ? `${second.provider.providerKey}:${second.provider.name}` : null,
    variants: accepted ? ["default"] : [],
    hostedStatus: "pending",
    fallback: !accepted,
    notes: accepted ? (best.exact ? "Exact normalized name with compatible equipment and muscle metadata." : "High-confidence unique structured match.") : ambiguous ? "Candidate requires human review; generated fallback remains active." : "No credible provider candidate; generated fallback remains active.",
    providerSourcePath: accepted ? path.relative(providerRoot, best.provider.sourcePath).replaceAll("\\", "/") : null,
    providerCollection: accepted ? best.provider.collection : null,
    providerExerciseId: accepted ? best.provider.id : null,
    providerExerciseName: accepted ? best.provider.name : null,
    providerEquipment: accepted ? best.provider.equipment : null,
    providerTarget: accepted ? best.provider.target : null,
  };
});

const summary = {
  canonical: catalog.length,
  providerRecords: providers.length,
  realHumanMapped: 0,
  providerAnimationMapped: rows.filter((row) => row.status === "AUTO_MATCH").length,
  ambiguous: rows.filter((row) => row.status === "AMBIGUOUS").length,
  unmatched: rows.filter((row) => row.status === "UNMATCHED").length,
  selfHosted: 0,
  fallbackRemaining: rows.filter((row) => row.fallback).length,
};
const report = { product: "STHENO Product 17 v3 - Vital Animations", importedAt, provider: "Vital Animations", providerLicense: "Vital Animations EULA 2026.1", sourceArchiveSha256: process.env.VITAL_ARCHIVE_SHA256 ?? null, summary, matches: rows };
const out = path.join(ROOT, "content", "exercise-media", "vital-animations");
await mkdir(out, { recursive: true });
await writeFile(path.join(out, "exercise-video-match-report.json"), `${JSON.stringify(report, null, 2)}\n`);
const columns = ["sthenoId","sthenoName","status","externalId","externalName","confidence","variants","hostedStatus","fallback","notes"];
const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => `"${String(Array.isArray(row[key]) ? row[key].join("|") : row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
await writeFile(path.join(out, "exercise-video-match-report.csv"), `${csv}\n`);
await writeFile(path.join(out, "provider-media-manifest.json"), `${JSON.stringify(rows.filter((row) => row.status === "AUTO_MATCH"), null, 2)}\n`);
const runtimeManifest = Object.fromEntries(rows.filter((row) => row.status === "AUTO_MATCH").map((row) => [row.sthenoId, {
  kind: "provider_animation",
  videoPath: `/exercise-media/vital/videos/${row.sthenoId}.mp4`,
  posterPath: `/exercise-media/vital/posters/${row.sthenoId}.webp`,
  provider: "Vital Animations",
  providerExerciseId: row.externalId,
}]));
const runtimeOut = path.join(ROOT, "src", "modules", "exercise-media");
await mkdir(runtimeOut, { recursive: true });
await writeFile(path.join(runtimeOut, "vital-manifest.json"), `${JSON.stringify(runtimeManifest, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
