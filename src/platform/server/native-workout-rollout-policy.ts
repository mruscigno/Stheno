export type NativeWorkoutRolloutState = "DISABLED" | "INTERNAL_TEST" | "LIMITED_PILOT" | "PUBLIC";
export type NativeWorkoutAccess = {
  enabled: boolean;
  state: NativeWorkoutRolloutState;
  cohort: "internal_test" | "limited_pilot" | null;
  reason: "enabled" | "disabled" | "not_authorized" | "public_prohibited" | "configuration_unavailable";
};

export type RolloutMember = { cohort: "internal_test" | "limited_pilot"; active: boolean; starts_at: string; ends_at: string | null };

export function evaluateNativeWorkoutRollout(state: NativeWorkoutRolloutState, member: RolloutMember | null, at = new Date()): NativeWorkoutAccess {
  if (state === "DISABLED") return { enabled: false, state, cohort: member?.cohort ?? null, reason: "disabled" };
  if (state === "PUBLIC") return { enabled: false, state, cohort: member?.cohort ?? null, reason: "public_prohibited" };
  const inWindow = Boolean(member?.active && new Date(member.starts_at) <= at && (!member.ends_at || new Date(member.ends_at) > at));
  const cohortAllowed = state === "INTERNAL_TEST" ? member?.cohort === "internal_test" : member?.cohort === "internal_test" || member?.cohort === "limited_pilot";
  return { enabled: inWindow && cohortAllowed, state, cohort: member?.cohort ?? null, reason: inWindow && cohortAllowed ? "enabled" : "not_authorized" };
}
