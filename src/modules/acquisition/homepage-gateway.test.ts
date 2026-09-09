import { describe, expect, it } from "vitest";
import { chooseHomepageEntry, readSavedAssessment } from "./homepage-gateway";

const base = {
  auth: "signed-out" as const,
  explored: false,
  assessment: null,
  hasBlueprint: false,
  variant: "assessment_gateway_v1" as const,
};

describe("homepage assessment gateway entry state", () => {
  it("shows the gateway to an eligible new visitor", () => {
    expect(chooseHomepageEntry(base)).toBe("gateway");
  });

  it("preserves Explore and control experiences", () => {
    expect(chooseHomepageEntry({ ...base, explored: true })).toBe("homepage");
    expect(chooseHomepageEntry({ ...base, variant: "control_homepage" })).toBe("homepage");
  });

  it("resumes conversion without restarting completed or incomplete visitors", () => {
    expect(chooseHomepageEntry({ ...base, assessment: { version: "3.0.0", startedAt: "now", index: 4 } })).toBe("continue");
    expect(chooseHomepageEntry({ ...base, hasBlueprint: true })).toBe("blueprint");
    expect(chooseHomepageEntry({ ...base, auth: "signed-in" })).toBe("member");
    expect(chooseHomepageEntry({ ...base, auth: "signed-in", assessment: { version: "3.0.0", startedAt: "now", index: 2 } })).toBe("continue");
  });

  it("rejects stale or malformed assessment storage", () => {
    expect(readSavedAssessment("not json")).toBeNull();
    expect(readSavedAssessment('{"version":"old"}')).toBeNull();
  });
});
