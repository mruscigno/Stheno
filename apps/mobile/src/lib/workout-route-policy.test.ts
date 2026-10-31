import { describe, expect, it } from "vitest";
import { canOpenNativeWorkout, shouldAutoStartWorkout } from "./workout-route-policy";

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

describe("workout route rollout policy", () => {
  it("allows a server-authorized member to open native workout logging", () => {
    expect(canOpenNativeWorkout({ rolloutEnabled: true, authenticatedOffline: false, hasPersistedWorkout: false })).toBe(true);
  });

  it("restores an existing local workout while the authenticated member is offline", () => {
    expect(canOpenNativeWorkout({ rolloutEnabled: false, authenticatedOffline: true, hasPersistedWorkout: true })).toBe(true);
  });

  it("fails closed offline when no local workout already exists", () => {
    expect(canOpenNativeWorkout({ rolloutEnabled: false, authenticatedOffline: true, hasPersistedWorkout: false })).toBe(false);
  });
});
