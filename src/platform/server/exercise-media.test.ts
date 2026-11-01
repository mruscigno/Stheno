import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { resolveExerciseMedia, resolveExerciseMediaSet } from "./exercise-media";

describe("App 6D-2 exercise media resolution", () => {
  afterEach(() => { delete process.env.STHENO_MEDIA_6D2_ENABLED; });

  it("preserves the approved Vital mapping while the new rollout is disabled", async () => {
    process.env.STHENO_MEDIA_6D2_ENABLED = "false";
    const media = await resolveExerciseMedia({} as never, { id: "unused", slug: "dumbbell-bench-press" });
    expect(media).toMatchObject({
      kind: "provider_animation",
      fallback: true,
      videoPath: "/exercise-media/vital/videos/dumbbell-bench-press.mp4",
    });
  });

  it("returns written-guide fallback when neither catalog has media", async () => {
    const media = await resolveExerciseMedia({} as never, { id: "unused", slug: "not-a-real-exercise" });
    expect(media).toBeNull();
  });

  it("returns the fallback as a one-item ranked media set while the flag is off", async () => {
    const media = await resolveExerciseMediaSet({} as never, { id: "unused", slug: "dumbbell-bench-press" });
    expect(media).toHaveLength(1);
    expect(media[0]?.fallback).toBe(true);
  });
});
