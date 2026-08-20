import { loadImage } from "@napi-rs/canvas";
import ffmpegPath from "ffmpeg-static";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content", "exercises");
const catalog = JSON.parse(await readFile(path.join(CONTENT, "canonical-exercises.json"), "utf8"));
const restored = JSON.parse(await readFile(path.join(CONTENT, "restored-exercises.json"), "utf8"));
const specs = JSON.parse(await readFile(path.join(CONTENT, "motion-specs.json"), "utf8"));
const failures = [];
const hashes = new Map();

if (catalog.length !== 330 || restored.length !== 330 || specs.length !== 330) failures.push("Catalog, restored mapping, and motion specs must each contain 330 records");
const catalogSlugs = new Set(catalog.map((item) => item.slug));
if (catalogSlugs.size !== 330) failures.push("Canonical exercise slugs are not unique");

function inspectVideo(file) {
  return new Promise((resolve) => {
    const child = spawn(ffmpegPath, ["-v", "info", "-i", file, "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] });
    let output = ""; child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("close", (code) => resolve({ code, output }));
  });
}

async function validateExercise(exercise) {
  const video = path.join(ROOT, "public", "exercise-media", "videos", `${exercise.slug}.mp4`);
  const poster = path.join(ROOT, "public", "exercise-media", "posters", `${exercise.slug}.webp`);
  try {
    if ((await stat(video)).size < 5000) throw new Error("MP4 is unexpectedly small");
    const buffer = await readFile(video); const hash = createHash("sha256").update(buffer).digest("hex");
    if (hashes.has(hash)) throw new Error(`duplicates ${hashes.get(hash)}`); hashes.set(hash, exercise.slug);
    const inspection = await inspectVideo(video);
    if (inspection.code !== 0) throw new Error("MP4 decode failed");
    if (!/Video: h264/i.test(inspection.output) || !/360x480/.test(inspection.output)) throw new Error("Expected H.264 at 360x480");
    const duration = inspection.output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (!duration || Number(duration[3]) <= 0) throw new Error("Duration is not positive");
    const image = await loadImage(poster); if (image.width !== 360 || image.height !== 480) throw new Error("Poster must be 360x480");
    const restoredExercise = restored.find((item) => item.slug === exercise.slug);
    if (!restoredExercise || restoredExercise.videoPath !== `/exercise-media/videos/${exercise.slug}.mp4` || restoredExercise.posterPath !== `/exercise-media/posters/${exercise.slug}.webp`) throw new Error("Public page/workout mapping is missing");
    const spec = specs.find((item) => item.slug === exercise.slug);
    if (!spec || spec.renderVersion !== "stheno-3d-2.0.0" || !spec.bodyStartPose || !spec.bodyEndPose || !spec.equipmentSetup || !spec.cameraAngle) throw new Error("Exercise-specific 3D motion spec is incomplete");
    if (!restoredExercise.education || !restoredExercise.alternatives || restoredExercise.alternatives.length < 3) throw new Error("Instructions, anatomy, or alternatives were not preserved");
  } catch (error) { failures.push(`${exercise.slug}: ${error instanceof Error ? error.message : String(error)}`); }
}

for (let index = 0; index < catalog.length; index += 10) {
  await Promise.all(catalog.slice(index, index + 10).map(validateExercise));
  if ((index + 10) % 50 === 0 || index + 10 >= catalog.length) console.log(`Validated ${Math.min(index + 10, catalog.length)}/330`);
}

const report = { product: "STHENO Product 17 v2", validatedAt: new Date().toISOString(), exercises: catalog.length, videos: hashes.size, posters: catalog.length - failures.filter((item) => item.includes("Poster")).length, mapped: restored.filter((item) => catalogSlugs.has(item.slug) && item.videoPath && item.posterPath).length, automatedValidation: failures.length ? 330 - failures.length : 330, rendererVersion: "stheno-3d-2.0.0", codec: "H.264", dimensions: "360x480", failures };
await writeFile(path.join(CONTENT, "product17-validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Product 17 media validation passed: 330/330.");
