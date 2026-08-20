import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ExerciseVideo } from "../../components/exercises/exercise-video";
import catalog from "../../../content/exercises/canonical-exercises.json";
import report from "../../../content/exercise-media/vital-animations/exercise-video-match-report.json";
import manifest from "../exercise-media/vital-manifest.json";

describe("Vital Animations media ingestion", () => {
  it("preserves the complete canonical STHENO library", () => {
    expect(catalog).toHaveLength(330);
    expect(report.summary.canonical).toBe(330);
    expect(report.matches).toHaveLength(330);
  });

  it("publishes only accepted, self-hosted mappings", () => {
    const accepted = report.matches.filter((row) => row.status === "AUTO_MATCH");
    expect(accepted).toHaveLength(report.summary.providerAnimationMapped);
    expect(Object.keys(manifest)).toHaveLength(accepted.length);
    for (const row of accepted) {
      const media = manifest[row.sthenoId as keyof typeof manifest];
      expect(row.hostedStatus).toBe("ready");
      expect(row.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(media?.kind).toBe("provider_animation");
      expect(existsSync(path.join(process.cwd(), "public", media.videoPath))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", media.posterPath))).toBe(true);
      expect(readFileSync(path.join(process.cwd(), "public", media.videoPath)).subarray(4, 8).toString()).toBe("ftyp");
    }
  });

  it("retains generated fallback for every non-accepted exercise", () => {
    const accepted = new Set(Object.keys(manifest));
    for (const exercise of catalog) {
      if (accepted.has(exercise.slug)) continue;
      expect(existsSync(path.join(process.cwd(), "public", "exercise-media", "videos", `${exercise.slug}.mp4`))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", "exercise-media", "posters", `${exercise.slug}.webp`))).toBe(true);
    }
  });

  it("prioritizes provider media and keeps the generated source behind it", () => {
    const html = renderToStaticMarkup(createElement(ExerciseVideo, { slug: "barbell-back-squat", name: "Barbell Back Squat" }));
    expect(html.indexOf("/exercise-media/vital/videos/barbell-back-squat.mp4")).toBeLessThan(html.indexOf("/exercise-media/videos/barbell-back-squat.mp4"));
    expect(html).toContain("playsInline");
    expect(html).toContain('preload="none"');
  });
});
