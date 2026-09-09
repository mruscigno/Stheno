import { ASSESSMENT_VERSION, type Intake } from "@/modules/acquisition/assessment-model";

export const ASSESSMENT_STORAGE = `stheno_assessment_${ASSESSMENT_VERSION}`;
export const BLUEPRINT_STORAGE = "stheno_blueprint";
export const GATEWAY_DISMISS_STORAGE = "stheno_homepage_gateway_dismissed";
export const GATEWAY_VARIANT_STORAGE = "stheno_homepage_gateway_variant";

export const gatewayVariants = [
  "control_homepage",
  "assessment_gateway_v1",
  "assessment_gateway_v2",
] as const;
export type GatewayVariant = (typeof gatewayVariants)[number];
export type HomepageEntryState =
  | "loading"
  | "homepage"
  | "gateway"
  | "continue"
  | "blueprint"
  | "member";

export type SavedAssessment = {
  version: string;
  answers?: Intake;
  index?: number;
  review?: boolean;
  startedAt?: string;
  updatedAt?: string;
};

export function readSavedAssessment(raw: string | null): SavedAssessment | null {
  try {
    const value = JSON.parse(raw || "null") as SavedAssessment | null;
    return value?.version === ASSESSMENT_VERSION ? value : null;
  } catch {
    return null;
  }
}

export function chooseHomepageEntry({
  auth,
  explored,
  assessment,
  hasBlueprint,
  variant,
}: {
  auth: "loading" | "signed-in" | "signed-out";
  explored: boolean;
  assessment: SavedAssessment | null;
  hasBlueprint: boolean;
  variant: GatewayVariant;
}): HomepageEntryState {
  if (auth === "loading") return "loading";
  const incomplete = Boolean(assessment?.startedAt && (Number(assessment.index) > 0 || assessment.review));
  if (auth === "signed-in" && incomplete) return "continue";
  if (auth === "signed-in") return "member";
  if (hasBlueprint) return "blueprint";
  if (incomplete) return "continue";
  if (explored || variant === "control_homepage") return "homepage";
  return "gateway";
}

export function approvedGatewayVariant(value: string | null): GatewayVariant | null {
  return gatewayVariants.includes(value as GatewayVariant) ? (value as GatewayVariant) : null;
}
