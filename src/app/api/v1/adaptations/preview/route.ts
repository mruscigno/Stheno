import { z } from "zod";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { proposeAdjustment } from "@/modules/coaching/engine";

const Input = z.object({ intent: z.enum(["traveling", "different_equipment", "schedule_changed", "short_on_time", "extra_rest_day", "pain", "other"]), scope: z.enum(["session_only", "date_range", "week", "current_program", "until_changed", "persistent"]), details: z.string().trim().max(2000).optional() });
export async function POST(request: Request) {
  const id = requestId(request), auth = await authorizeMemberRequest(request);
  if (!auth.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (auth.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.");
  const parsed = await parseJson(request, Input);
  if (!parsed.data) return apiError(id, 400, "VALIDATION_FAILED", "Invalid adaptation request.", parsed.error);
  const proposal = proposeAdjustment(parsed.data.intent, parsed.data.scope);
  const { data, error } = await auth.context.db.from("plan_adjustment_requests").insert({ user_id: auth.context.user.id, intent: parsed.data.intent, explicit_context: { details: parsed.data.details }, scope: proposal.proposal?.scope ?? parsed.data.scope, safety_classification: proposal.safety, proposal: proposal.proposal, reason_codes: proposal.reasonCodes, confirmation_status: proposal.blocked ? "blocked" : "pending" }).select("id,proposal,reason_codes,confirmation_status,safety_classification").single();
  if (error) return apiError(id, 503, "SERVICE_UNAVAILABLE", "The adaptation could not be prepared.");
  return apiSuccess(id, { request: data, reviewRequired: !proposal.blocked, safetyMessage: proposal.blocked ? "Do not train through significant pain. Seek qualified care for severe, sudden, or persistent symptoms." : null }, { status: 201 });
}
