import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const customerFiles = [
    "src/components/workout/workout-experience.tsx",
    "src/components/exercises/movement-demo.tsx",
    "src/app/exercises/[slug]/page.tsx",
  ],
  banned = [
    "licensed content",
    "reviewed content",
    "prescribable",
    "engine version",
    "ruleset",
    "awaiting review",
    "demonstration media will appear",
  ];
describe("consumer exercise language", () => {
  it.each(customerFiles)(
    "keeps internal implementation language out of %s",
    (file) => {
      const copy = readFileSync(
        resolve(process.cwd(), file),
        "utf8",
      ).toLowerCase();
      for (const phrase of banned) expect(copy).not.toContain(phrase);
    },
  );
});
