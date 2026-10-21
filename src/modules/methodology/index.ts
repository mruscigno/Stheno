import { methodologyPolicies, policiesFor } from "./policies";
import { METHODOLOGY_VERSION, methodologyClaims } from "./registry";

export const methodologyFeatureFlags = {
  policyMetadata: process.env.STHENO_METHODOLOGY_V2 !== "false",
  coachContext: process.env.STHENO_METHODOLOGY_COACH !== "false",
} as const;

export function decisionMetadata(policyIds: string[], claimIds: string[]) {
  if (!methodologyFeatureFlags.policyMetadata) return {};
  return { methodologyVersion: METHODOLOGY_VERSION, policyIds, evidenceClaimIds: claimIds };
}

export function coachMethodologyContext(domain: string) {
  if (!methodologyFeatureFlags.coachContext) return null;
  const mapped = domain === "technique" ? "training" : domain === "supplements" ? "supplements" : domain === "nutrition" ? "nutrition" : "coach";
  const policies = policiesFor(mapped as "training" | "nutrition" | "supplements" | "coach");
  const claimIds = new Set(policies.flatMap((policy) => policy.evidenceClaimIds));
  return {
    version: METHODOLOGY_VERSION,
    policies: policies.map(({ id, rule, explanation, contraindications }) => ({ id, rule, explanation, contraindications })),
    claims: methodologyClaims.filter((claim) => claimIds.has(claim.id)).map(({ id, statement, confidence, limitations }) => ({ id, statement, confidence, limitations })),
    boundary: "Explain deterministic recommendations. Do not silently change a plan, diagnose, or override safety routing.",
  };
}

export { METHODOLOGY_VERSION, methodologyClaims, methodologyPolicies };
