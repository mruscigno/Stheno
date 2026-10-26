import type { MemberReadModel } from "@shared/contracts/api";

export type AppDestination = "assessment" | "resume" | "today" | "membership";
export function destinationForMember(member: MemberReadModel): AppDestination {
  if (member.profile?.lifecycle_state && ["assessment_started", "assessment_incomplete"].includes(member.profile.lifecycle_state)) return "resume";
  return member.access.hasAccess ? "today" : "membership";
}

export function canClaimFinalizedAssessment(input: { hasAuthSession: boolean; assessmentState: string | null; claimStarted: boolean }) {
  return input.hasAuthSession && input.assessmentState === "finalized" && !input.claimStarted;
}
