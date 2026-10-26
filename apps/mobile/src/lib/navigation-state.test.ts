import { describe, expect, it } from "vitest";
import type { MemberReadModel } from "@shared/contracts/api";
import { canClaimFinalizedAssessment, destinationForMember } from "./navigation-state";

function member(overrides: Partial<MemberReadModel> = {}): MemberReadModel { return { id: "user-a", email: "fixture@example.test", profile: { display_name: null, lifecycle_state: "active", time_zone: null, created_at: "2026-01-01", updated_at: "2026-01-01" }, preferences: null, access: { hasAccess: true, state: "trial" }, subscription: null, entitlements: [], ...overrides }; }
describe("auth destination state machine", () => {
  it("routes eligible members to Today", () => expect(destinationForMember(member())).toBe("today"));
  it("routes incomplete assessments before entitlement", () => expect(destinationForMember(member({ profile: { display_name: null, lifecycle_state: "assessment_incomplete", time_zone: null, created_at: "2026-01-01", updated_at: "2026-01-01" } }))).toBe("resume"));
  it("routes expired members to the neutral membership state", () => expect(destinationForMember(member({ access: { hasAccess: false, state: "expired" } }))).toBe("membership"));
});

describe("anonymous assessment claim handoff", () => {
  it("starts the claim as soon as an authenticated session exists, even while member bootstrap is pending", () => {
    expect(canClaimFinalizedAssessment({ hasAuthSession: true, assessmentState: "finalized", claimStarted: false })).toBe(true);
  });
  it("does not replay or claim incomplete assessments", () => {
    expect(canClaimFinalizedAssessment({ hasAuthSession: true, assessmentState: "finalized", claimStarted: true })).toBe(false);
    expect(canClaimFinalizedAssessment({ hasAuthSession: true, assessmentState: "in_progress", claimStarted: false })).toBe(false);
    expect(canClaimFinalizedAssessment({ hasAuthSession: false, assessmentState: "finalized", claimStarted: false })).toBe(false);
  });
});
