import { z } from "zod";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { COACH_ENGINE_VERSION, COACH_RULESET_VERSION } from "@/modules/coaching/engine";

const Input = z.object({ requestId: z.uuid(), decision: z.enum(["confirmed", "cancelled"]) });
export async function POST(request: Request) {
  const id = requestId(request), auth = await authorizeMemberRequest(request);
  if (!auth.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (auth.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.");
  const parsed = await parseJson(request, Input);
  if (!parsed.data) return apiError(id, 400, "VALIDATION_FAILED", "Invalid adaptation decision.", parsed.error);
  const { data: pending } = await auth.context.db.from("plan_adjustment_requests").select("*").eq("id", parsed.data.requestId).eq("user_id", auth.context.user.id).eq("confirmation_status", "pending").maybeSingle();
  if (!pending) return apiError(id, 409, "CONFLICT", "This proposal is no longer pending.");
  const now = new Date().toISOString();
  const { error } = await auth.context.db.from("plan_adjustment_requests").update({ confirmation_status: parsed.data.decision, decided_at: now }).eq("id", pending.id).eq("user_id", auth.context.user.id);
  if (error) return apiError(id, 503, "SERVICE_UNAVAILABLE", "The decision could not be saved.");
  if (parsed.data.decision === "confirmed") await auth.context.db.from("coach_decisions").insert({ user_id: auth.context.user.id, decision_type: "schedule", reason_code: pending.reason_codes?.[0] ?? "USER_CONFIRMED_ADAPTATION", prior_state: {}, proposed_state: pending.proposal, new_state: pending.proposal, structured_inputs: { adjustment_request_id: pending.id }, scope: pending.scope, source: "coach_conversation", confirmation_required: true, confirmation_status: "committed", engine_version: COACH_ENGINE_VERSION, ruleset_version: COACH_RULESET_VERSION });
  return apiSuccess(id, { status: parsed.data.decision });
}
