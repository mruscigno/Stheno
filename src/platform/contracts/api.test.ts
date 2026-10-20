import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CompleteWorkoutInput, ExerciseListQuery, MonthlyDecisionInput, StartWorkoutInput, UpsertWorkoutSetInput } from "./api";

const uuid = "8f7614c8-46ee-4a11-baf8-9737d57eb450";

describe("mobile-safe API contracts", () => {
  it("validates public pagination limits and filters", () => {
    expect(ExerciseListQuery.parse({ limit: "25", equipment: "dumbbells" })).toMatchObject({ limit: 25, equipment: "dumbbells" });
    expect(ExerciseListQuery.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("requires stable operation IDs for every replayable mutation", () => {
    expect(StartWorkoutInput.parse({ operationId: uuid, clientSessionKey: uuid }).operationId).toBe(uuid);
    expect(UpsertWorkoutSetInput.safeParse({ operationId: uuid, baseRevision: 0, exerciseSlug: "goblet-squat", setOrdinal: 1, prescribed: {}, state: "completed" }).success).toBe(true);
    expect(CompleteWorkoutInput.safeParse({ operationId: uuid, baseRevision: 0, effort: "about_right" }).success).toBe(true);
    expect(MonthlyDecisionInput.safeParse({ operationId: uuid, action: "keep" }).success).toBe(true);
  });

  it("keeps client contracts free of privileged and framework imports", () => {
    const source = readFileSync(resolve(process.cwd(), "src/platform/contracts/api.ts"), "utf8");
    expect(source).not.toMatch(/next\//);
    expect(source).not.toMatch(/supabase/);
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/service[_-]?role/i);
  });
});
