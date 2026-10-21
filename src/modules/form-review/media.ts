import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { FORM_REVIEW_MAX_BYTES, FORM_REVIEW_MAX_SECONDS } from "./contracts";

export type ExtractedFrame = { timestampSeconds: number; jpeg: Buffer };
export type DecodedVideo = { durationSeconds: number; codec: string; frames: ExtractedFrame[] };

const runtimeRequire = createRequire(import.meta.url);
export function resolveFfmpegPath() {
  if (ffmpegPath && existsSync(ffmpegPath)) return ffmpegPath;
  const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  try {
    const packaged = join(dirname(runtimeRequire.resolve("ffmpeg-static/package.json")), binary);
    if (existsSync(packaged)) return packaged;
  } catch { /* Fall through to the traced workspace path. */ }
  const traced = join(process.cwd(), "node_modules", "ffmpeg-static", binary);
  return existsSync(traced) ? traced : ffmpegPath;
}

function runFfmpeg(args: string[]) {
  return new Promise<{ stderr: string }>((resolve, reject) => {
    const executable = resolveFfmpegPath();
    if (!executable) return reject(new Error("FFMPEG_UNAVAILABLE"));
    const child = spawn(executable, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk).slice(0, 20_000); });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve({ stderr }) : reject(new Error(`FFMPEG_FAILED:${code}`)));
  });
}

export function sampleTimestamps(durationSeconds: number, count = 12) {
  const boundedCount = Math.max(1, Math.min(12, count));
  const start = Math.min(0.25, durationSeconds * 0.05);
  const end = Math.max(start, durationSeconds - start);
  if (boundedCount === 1) return [Number(((start + end) / 2).toFixed(3))];
  return Array.from({ length: boundedCount }, (_, index) => Number((start + ((end - start) * index) / (boundedCount - 1)).toFixed(3)));
}

export async function decodeAndSampleVideo(bytes: Uint8Array): Promise<DecodedVideo> {
  if (bytes.byteLength <= 8 || bytes.byteLength > FORM_REVIEW_MAX_BYTES) throw new Error("INVALID_MEDIA_SIZE");
  const folder = await mkdtemp(join(tmpdir(), "stheno-form-review-"));
  const input = join(folder, "input.bin");
  try {
    await writeFile(input, bytes);
    const probe = await runFfmpeg(["-hide_banner", "-i", input, "-map", "0:v:0", "-frames:v", "1", "-f", "null", "-"]);
    const durationMatch = probe.stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    const codecMatch = probe.stderr.match(/Video:\s*([a-zA-Z0-9_]+)/);
    if (!durationMatch || !codecMatch) throw new Error("UNREADABLE_VIDEO");
    const durationSeconds = Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3]);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > FORM_REVIEW_MAX_SECONDS) throw new Error("INVALID_VIDEO_DURATION");
    const codec = codecMatch[1].toLowerCase();
    if (!["h264", "hevc", "mpeg4", "prores"].includes(codec)) throw new Error("UNSUPPORTED_VIDEO_CODEC");
    const timestamps = sampleTimestamps(durationSeconds);
    await Promise.all(timestamps.map((timestamp, index) => runFfmpeg([
      "-v", "error", "-ss", String(timestamp), "-i", input, "-map", "0:v:0", "-frames:v", "1",
      "-vf", "scale='min(768,iw)':-2:force_original_aspect_ratio=decrease", "-q:v", "4", "-map_metadata", "-1",
      join(folder, `frame-${String(index).padStart(2, "0")}.jpg`),
    ])));
    const names = (await readdir(folder)).filter((name) => name.endsWith(".jpg")).sort();
    if (names.length < 4) throw new Error("INSUFFICIENT_FRAMES");
    const frames = await Promise.all(names.map(async (name, index) => ({ timestampSeconds: timestamps[index] ?? 0, jpeg: await readFile(join(folder, name)) })));
    return { durationSeconds, codec, frames };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

