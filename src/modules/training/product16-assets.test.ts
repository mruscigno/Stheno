// @vitest-environment node
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type Restored = {
  slug: string;
  primaryMuscles: string[];
  education: { setup: string[]; execution: string[]; cues: string[]; mistakes: string[] };
  alternatives: { slug: string; sharedPrimaryMuscles: string[] }[];
  videoPath: string;
  posterPath: string;
  productionReady: boolean;
  reviewStatus: string;
};

describe("Product 16 complete exercise library", () => {
  const root = process.cwd();
  const catalog = JSON.parse(readFileSync(path.join(root,"content/exercises/restored-exercises.json"),"utf8")) as Restored[];

  it("contains exactly 330 unique production-ready exercises", () => {
    expect(catalog).toHaveLength(330);
    expect(new Set(catalog.map(x => x.slug)).size).toBe(330);
    expect(catalog.every(x => x.productionReady && x.reviewStatus === "approved")).toBe(true);
  });

  it("has detailed education and muscle-matched alternatives for every exercise", () => {
    const bySlug = new Map(catalog.map(x => [x.slug,x]));
    for (const exercise of catalog) {
      expect(exercise.education.setup.length).toBeGreaterThanOrEqual(3);
      expect(exercise.education.execution.length).toBeGreaterThanOrEqual(4);
      expect(exercise.education.cues.length).toBeGreaterThanOrEqual(3);
      expect(exercise.education.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(exercise.alternatives.length).toBeGreaterThanOrEqual(3);
      for (const candidate of exercise.alternatives) {
        expect(bySlug.has(candidate.slug)).toBe(true);
        expect(candidate.sharedPrimaryMuscles.length).toBeGreaterThan(0);
        expect(candidate.sharedPrimaryMuscles.every(m => exercise.primaryMuscles.includes(m))).toBe(true);
      }
    }
  });

  it("ships a non-empty MP4 and poster for every exercise", () => {
    for (const exercise of catalog) {
      for (const publicPath of [exercise.videoPath,exercise.posterPath]) {
        const file = path.join(root,"public",publicPath.replace(/^\//,""));
        expect(existsSync(file), file).toBe(true);
        expect(statSync(file).size, file).toBeGreaterThan(1000);
      }
    }
  });
});
