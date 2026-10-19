import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type CanonicalExercise = { slug: string };
type MediaManifest = Record<string, { videoPath: string; posterPath: string }>;

describe("App 1 exercise parity gate", () => {
  it("preserves all canonical exercise identities", () => {
    const exercises = JSON.parse(readFileSync(resolve(process.cwd(), "content/exercises/canonical-exercises.json"), "utf8")) as CanonicalExercise[];
    const ids = exercises.map((item) => item.slug).sort();
    expect(ids).toHaveLength(330);
    expect(new Set(ids).size).toBe(330);
    expect(createHash("sha256").update(ids.join("\n")).digest("hex")).toBe("607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b");
  });

  it("keeps every purchased media mapping structurally complete", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "src/modules/exercise-media/vital-manifest.json"), "utf8")) as MediaManifest;
    expect(Object.keys(manifest)).toHaveLength(298);
    for (const media of Object.values(manifest)) {
      expect(media.videoPath).toMatch(/^\/exercise-media\/vital\/videos\/.+\.mp4$/);
      expect(media.posterPath).toMatch(/^\/exercise-media\/vital\/posters\/.+\.webp$/);
    }
  });
});
