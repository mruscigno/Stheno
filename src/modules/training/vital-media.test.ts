import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ExerciseVideo } from "../../components/exercises/exercise-video";
import catalog from "../../../content/exercises/canonical-exercises.json";
import report from "../../../content/exercise-media/vital-animations/exercise-video-match-report.json";
import manifest from "../exercise-media/vital-manifest.json";
import expansion from "../../../content/exercises/vital-provider-expansion.json";

describe("Vital Animations media ingestion", () => {
  it("preserves the complete canonical STHENO library", () => {
    expect(catalog).toHaveLength(330);
    expect(report.summary.canonical).toBe(330);
    expect(report.matches).toHaveLength(330);
  });

  it("publishes only accepted, self-hosted mappings", () => {
    const accepted = report.matches.filter((row) => row.status === "AUTO_MATCH");
    expect(accepted).toHaveLength(report.summary.providerAnimationMapped);
    expect(Object.keys(manifest)).toHaveLength(accepted.length + expansion.length);
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

  it("adds distinct provider exercises with complete guides and self-hosted media", () => {
    expect(expansion).toHaveLength(237);
    const baseSlugs = new Set(catalog.map((exercise) => exercise.slug));
    const addedSlugs = new Set(expansion.map((exercise) => exercise.slug));
    expect(addedSlugs.size).toBe(expansion.length);
    for (const exercise of expansion) {
      expect(baseSlugs.has(exercise.slug)).toBe(false);
      expect(exercise.education.setup.length).toBeGreaterThanOrEqual(1);
      expect(exercise.education.execution.length).toBeGreaterThanOrEqual(1);
      expect(exercise.education.cues.length).toBeGreaterThanOrEqual(3);
      expect(exercise.education.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(existsSync(path.join(process.cwd(), "public", exercise.media.videoPath))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", exercise.media.posterPath))).toBe(true);
    }
  });

  it("renders instructions only when purchased provider media is unavailable", () => {
    const accepted = new Set(Object.keys(manifest));
    for (const exercise of catalog) {
      if (accepted.has(exercise.slug)) continue;
      expect(existsSync(path.join(process.cwd(), "public", "exercise-media", "videos", `${exercise.slug}.mp4`))).toBe(false);
      expect(existsSync(path.join(process.cwd(), "public", "exercise-media", "posters", `${exercise.slug}.webp`))).toBe(false);
      expect(renderToStaticMarkup(createElement(ExerciseVideo, { slug: exercise.slug, name: exercise.name }))).toBe("");
    }
  });

  it("uses only purchased provider media when available", () => {
    const html = renderToStaticMarkup(createElement(ExerciseVideo, { slug: "barbell-back-squat", name: "Barbell Back Squat" }));
    expect(html).toContain("/exercise-media/vital/videos/barbell-back-squat.mp4");
    expect(html).not.toContain("/exercise-media/videos/barbell-back-squat.mp4");
    expect(html).toContain("playsInline");
    expect(html).toContain('preload="none"');
  });
});
