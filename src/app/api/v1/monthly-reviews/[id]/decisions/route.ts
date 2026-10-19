import { MonthlyDecisionInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { findOperation, recordOperation } from "@/platform/server/idempotency";
import { decideMonthlyRecommendations } from "@/platform/server/monthly-reviews";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestIdValue = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(requestIdValue, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(requestIdValue, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  const parsed = await parseJson(request, MonthlyDecisionInput);
  if (parsed.error) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid review decision.", parsed.error);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid review identifier.");
  const scope = `monthly-review:${id}:decision`;
  try {
    const operation = await findOperation(context.db, context.user.id, scope, parsed.data.operationId, parsed.data);
    if (operation.state === "conflict") return apiError(requestIdValue, 409, "IDEMPOTENCY_CONFLICT", "Operation ID was already used with a different decision.");
    if (operation.state === "replay") return apiSuccess(requestIdValue, operation.record.response_body, undefined, { replayed: true });
    const result = await decideMonthlyRecommendations(context.db, context.user.id, id, parsed.data.action, parsed.data.acceptedIds);
    if (!result) return apiError(requestIdValue, 404, "NOT_FOUND", "Monthly review was not found.");
    const response = { ...result, operationId: parsed.data.operationId, revision: 1, acknowledgedAt: new Date().toISOString() };
    await recordOperation(context.db, { userId: context.user.id, scope, operationId: parsed.data.operationId, payloadHash: operation.hash, responseBody: response, statusCode: 200, resourceRevision: 1 });
    return apiSuccess(requestIdValue, response);
  } catch (error) {
    if (error instanceof Error && error.message === "MONTHLY_RECOMMENDATION_NOT_FOUND") return apiError(requestIdValue, 404, "NOT_FOUND", "Recommendation was not found.");
    if (error instanceof Error && error.message === "MONTHLY_RECOMMENDATION_INVALID") return apiError(requestIdValue, 422, "VALIDATION_FAILED", "Recommendation did not pass deterministic validation.");
    return apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Review decision could not be saved.");
  }
}
