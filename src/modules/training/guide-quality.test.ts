import { describe, expect, it } from "vitest";
import { getSubstitutions } from "./adapt";
import {
  completeExerciseGuide,
  humanizeExerciseText,
} from "./guide-content";
import { productionExerciseLibrary } from "./exercises";
import type { Exercise, TrainingProfile } from "./types";

const profile: TrainingProfile = {
  profileId: "p",
  assessmentId: "a",
  goal: "build_muscle",
  experience: "intermediate",
  daysPerWeek: 3,
  sessionMinutes: 60,
  equipment: [
    "barbell",
    "dumbbells",
    "machines",
    "cables",
    "bench",
    "bands",
    "bodyweight",
  ],
  avoidances: [],
  preferences: [],
  safetyClassification: "normal",
};

describe("exercise guide quality gate", () => {
  it("never exposes stored enum identifiers in reader-facing prose", () => {
    expect(
      humanizeExerciseText(
        "Perform the horizontal_push pattern with the rear_delts under control.",
      ),
    ).toBe(
      "Perform the horizontal push pattern with the rear delts under control.",
    );
    const guide = completeExerciseGuide({
      name: "Bench Press",
      movementPattern: "horizontal_push",
      primaryMuscles: ["chest"],
      equipment: ["dumbbells"],
      education: {
        setup: ["Use the incline_bench.", "Set up.", "Brace."],
        execution: [
          "Perform the horizontal_push pattern.",
          "Lower.",
          "Press.",
          "Reset.",
        ],
        cues: ["Use rear_delts.", "Control.", "Breathe."],
        mistakes: ["Avoid joint_focused pain.", "Do not rush.", "Stay stable."],
        feel: "Chest, not joint_focused pressure.",
        stopModify: "Stop for joint_focused pain.",
      },
    });
    expect(JSON.stringify(guide)).not.toMatch(/[a-z]_[a-z]/);
  });
  it("preserves concise reviewed guidance instead of using length as quality", () => {
    const guide = completeExerciseGuide({
      name: "Seated Cable Row",
      movementPattern: "horizontal_pull",
      primaryMuscles: ["back"],
      equipment: ["cables"],
      education: {
        setup: ["Sit tall at the cable row."],
        execution: ["Drive the elbows toward the ribs."],
        cues: ["Stay tall."],
        mistakes: ["Do not rock."],
        feel: "Back working.",
        stopModify: "Stop for pain.",
      },
      productionReady: true,
    });
    expect(guide.setup).toEqual(["Sit tall at the cable row."]);
    expect(guide.execution).toEqual(["Drive the elbows toward the ribs."]);
    expect(guide.cues).toEqual(["Stay tall."]);
  });
  it("rejects incomplete production guidance instead of fabricating copy", () => {
    expect(() => completeExerciseGuide({
      name: "Pistol Squat",
      movementPattern: "squat",
      primaryMuscles: ["quadriceps"],
      equipment: ["bodyweight"],
      education: { setup: ["Balance on one leg."] },
      productionReady: true,
    })).toThrow(/PRODUCTION_GUIDANCE_INCOMPLETE/);
  });
  it("preserves concise reviewed hold guidance without injecting repetition copy", () => {
    const guide = completeExerciseGuide({
      name: "Forearm Plank",
      movementPattern: "isolation",
      primaryMuscles: ["core"],
      equipment: ["bodyweight"],
      education: {
        setup: ["Stack elbows under shoulders.", "Brace before lifting."],
        execution: [
          "Hold a straight line.",
          "Breathe behind the brace.",
          "Stop when position changes.",
        ],
        cues: ["Brace.", "Breathe.", "Stay long."],
        mistakes: ["Sagging.", "Holding breath.", "Looking up."],
        feel: "Sustained core effort.",
        stopModify: "Stop for pain.",
      },
    });
    expect(guide.execution.join(" ")).toMatch(/hold a straight line/i);
    expect(JSON.stringify(guide)).not.toMatch(
      /final repetition|next repetition/i,
    );
  });
  it("hard excludes primary-muscle mismatches from every substitution", () => {
    for (const original of productionExerciseLibrary) {
      for (const candidate of getSubstitutions(original.slug, profile, productionExerciseLibrary)) {
        expect(
          candidate.exercise.primaryMuscles.some((m) =>
            original.primaryMuscles.includes(m),
          ),
        ).toBe(true);
      }
    }
  });
  it("never offers curls or lateral raises for a triceps pressdown", () => {
    const slugs = getSubstitutions("cable-triceps-pressdown", profile, productionExerciseLibrary).map(
      (x) => x.exercise.slug,
    );
    expect(slugs).not.toContain("dumbbell-curl");
    expect(slugs).not.toContain("lateral-raise");
  });
  it.each([
    ["cable-row", ["back"]],
    ["dumbbell-bench-press", ["chest"]],
    ["lateral-raise", ["shoulders"]],
  ])("keeps alternatives for %s on its primary muscle", (slug, muscles) => {
    expect(
      getSubstitutions(slug, profile, productionExerciseLibrary).every((x) =>
        x.exercise.primaryMuscles.some((m) => muscles.includes(m)),
      ),
    ).toBe(true);
  });
  it("ranks hip hinges ahead of squat alternatives for a dumbbell RDL", () => {
    const library = [
      substitutionFixture("dumbbell-rdl", "rdl", "hinge", ["hamstrings", "glutes"], ["dumbbells"]),
      substitutionFixture("barbell-rdl", "rdl", "hinge", ["hamstrings", "glutes"], ["barbell"]),
      substitutionFixture("rack-pull", "deadlift", "hinge", ["hamstrings", "glutes"], ["barbell"]),
      substitutionFixture("back-squat", "squat", "squat", ["glutes", "hamstrings"], ["barbell"]),
    ];
    expect(getSubstitutions("dumbbell-rdl", profile, library).map((x) => x.exercise.slug)).toEqual([
      "barbell-rdl",
      "rack-pull",
      "back-squat",
    ]);
  });
  it("ranks horizontal rows ahead of vertical pulls for a seated cable row", () => {
    const library = [
      substitutionFixture("cable-row", "row", "horizontal_pull", ["back"], ["cables"]),
      substitutionFixture("machine-row", "row", "horizontal_pull", ["back"], ["machines"]),
      substitutionFixture("dumbbell-row", "row", "horizontal_pull", ["back"], ["dumbbells"]),
      substitutionFixture("assisted-pull-up", "pull_up", "vertical_pull", ["back"], ["machines"]),
    ];
    const ranked = getSubstitutions("cable-row", profile, library).map((x) => x.exercise.slug);
    expect(new Set(ranked.slice(0, 2))).toEqual(new Set(["machine-row", "dumbbell-row"]));
    expect(ranked[2]).toBe("assisted-pull-up");
  });
});

function substitutionFixture(
  slug: string,
  family: string,
  pattern: Exercise["pattern"],
  primaryMuscles: Exercise["primaryMuscles"],
  requiredEquipment: Exercise["requiredEquipment"],
): Exercise {
  return {
    slug,
    name: slug,
    family,
    pattern,
    role: "secondary",
    primaryMuscles,
    secondaryMuscles: [],
    requiredEquipment,
    skill: "beginner",
    fatigueCost: 2,
    setupMinutes: 2,
    repRange: [8, 12],
    progressionSuitability: 4,
    unilateral: false,
    instructions: ["Set up.", "Perform the movement."],
    cues: ["Stay controlled."],
    mistakes: ["Using momentum."],
    cautionTags: [],
    reviewStatus: "reviewed",
    contentVersion: "test",
    license: "STHENO_ORIGINAL",
  };
}
