import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const ROOT = process.cwd();
const providerRoot = path.resolve(process.argv[2] ?? path.join(ROOT, "..", "work", "vital-animations"));
const reportPath = path.join(ROOT, "content", "exercise-media", "vital-animations", "exercise-video-match-report.json");
const report = JSON.parse(await readFile(reportPath, "utf8"));
const accepted = report.matches.filter((row) => row.status === "AUTO_MATCH");
const videoDir = path.join(ROOT, "public", "exercise-media", "vital", "videos");
const posterDir = path.join(ROOT, "public", "exercise-media", "vital", "posters");
await mkdir(videoDir, { recursive: true });
await mkdir(posterDir, { recursive: true });

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk) => { error += chunk; });
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(error || `ffmpeg exited ${code}`)));
  });
}

async function prepare(row) {
  const input = path.join(providerRoot, row.providerSourcePath);
  const video = path.join(videoDir, `${row.sthenoId}.mp4`);
  const poster = path.join(posterDir, `${row.sthenoId}.webp`);
  await ffmpeg(["-i", input, "-an", "-vf", "scale=360:480:force_original_aspect_ratio=decrease,pad=360:480:(ow-iw)/2:(oh-ih)/2:color=white,fps=20", "-c:v", "libx264", "-profile:v", "main", "-level", "3.1", "-preset", "medium", "-crf", "29", "-movflags", "+faststart", "-pix_fmt", "yuv420p", video]);
  await ffmpeg(["-ss", "1", "-i", video, "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", poster]);
  const bytes = await readFile(video);
  row.hostedStatus = "ready";
  row.hostedVideoPath = `/exercise-media/vital/videos/${row.sthenoId}.mp4`;
  row.hostedPosterPath = `/exercise-media/vital/posters/${row.sthenoId}.webp`;
  row.checksum = createHash("sha256").update(bytes).digest("hex");
  row.mediaQuality = { codec: "H.264", dimensions: "360x480", bytes: (await stat(video)).size, posterBytes: (await stat(poster)).size };
  row.provenanceNote = "Commercially licensed provider animation; Vital Animations EULA 2026.1. STHENO does not claim ownership.";
  row.importedAt = new Date().toISOString();
}

for (let index = 0; index < accepted.length; index += 4) {
  await Promise.all(accepted.slice(index, index + 4).map(prepare));
  console.log(`Prepared ${Math.min(index + 4, accepted.length)}/${accepted.length}`);
}
report.summary.selfHosted = accepted.filter((row) => row.hostedStatus === "ready").length;
report.summary.fallbackRemaining = report.summary.canonical - report.summary.selfHosted;
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const manifestPath = path.join(ROOT, "content", "exercise-media", "vital-animations", "provider-media-manifest.json");
await writeFile(manifestPath, `${JSON.stringify(accepted, null, 2)}\n`);
const columns = ["sthenoId","sthenoName","status","externalId","externalName","confidence","variants","hostedStatus","fallback","notes"];
const csv = [columns.join(","), ...report.matches.map((row) => columns.map((key) => `"${String(Array.isArray(row[key]) ? row[key].join("|") : row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
await writeFile(path.join(ROOT, "content", "exercise-media", "vital-animations", "exercise-video-match-report.csv"), `${csv}\n`);
console.log(JSON.stringify(report.summary, null, 2));
