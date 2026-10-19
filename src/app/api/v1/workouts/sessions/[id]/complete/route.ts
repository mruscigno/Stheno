import { CompleteWorkoutInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { findOperation, recordOperation } from "@/platform/server/idempotency";
import { completeWorkout } from "@/platform/server/workouts";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestIdValue = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(requestIdValue, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(requestIdValue, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  const parsed = await parseJson(request, CompleteWorkoutInput);
  if (parsed.error) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid completion request.", parsed.error);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid workout identifier.");
  const scope = `workout:${id}:complete`;
  try {
    const operation = await findOperation(context.db, context.user.id, scope, parsed.data.operationId, parsed.data);
    if (operation.state === "conflict") return apiError(requestIdValue, 409, "IDEMPOTENCY_CONFLICT", "Operation ID was already used with a different completion request.");
    if (operation.state === "replay") return apiSuccess(requestIdValue, operation.record.response_body, undefined, { replayed: true });
    const result = await completeWorkout(context.db, context.user.id, id, parsed.data);
    if (result.state === "not_found") return apiError(requestIdValue, 404, "NOT_FOUND", "Workout session was not found.");
    if (result.state === "confirmation_required") return apiError(requestIdValue, 409, "CONFLICT", `${result.remainingSets} planned sets remain.`, result);
    const response = { ...result, operationId: parsed.data.operationId, revision: Number(parsed.data.baseRevision ?? 0) + 1, acknowledgedAt: new Date().toISOString() };
    await recordOperation(context.db, { userId: context.user.id, scope, operationId: parsed.data.operationId, payloadHash: operation.hash, responseBody: response, statusCode: 200, resourceRevision: response.revision });
    return apiSuccess(requestIdValue, response);
  } catch { return apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Workout could not be completed."); }
}
