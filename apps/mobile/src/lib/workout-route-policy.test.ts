import { describe, expect, it } from "vitest";
import { shouldAutoStartWorkout } from "./workout-route-policy";

describe("workout route auto-start policy", () => {
  it("starts once when a member intentionally opens a workout without a local session", () => {
    expect(shouldAutoStartWorkout({
      hasWorkout: false,
      hasFallback: true,
      observedWorkout: false,
      autoStartAttempted: false,
    })).toBe(true);
  });

  it("does not create another session after a reconciled workout leaves the active selector", () => {
    expect(shouldAutoStartWorkout({
      hasWorkout: false,
      hasFallback: true,
      observedWorkout: true,
      autoStartAttempted: true,
    })).toBe(false);
  });
});
