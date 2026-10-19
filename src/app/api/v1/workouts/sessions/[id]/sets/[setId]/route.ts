import { UpsertWorkoutSetInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { findOperation, recordOperation } from "@/platform/server/idempotency";
import { upsertWorkoutSet } from "@/platform/server/workouts";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; setId: string }> }) {
  const requestIdValue = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(requestIdValue, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(requestIdValue, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  const parsed = await parseJson(request, UpsertWorkoutSetInput);
  if (parsed.error) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid set update.", parsed.error);
  const { id, setId } = await params;
  if (![id, setId].every((value) => /^[0-9a-f-]{36}$/i.test(value))) return apiError(requestIdValue, 400, "VALIDATION_FAILED", "Invalid resource identifier.");
  const scope = `workout:${id}:set:${setId}`;
  try {
    const operation = await findOperation(context.db, context.user.id, scope, parsed.data.operationId, parsed.data);
    if (operation.state === "conflict") return apiError(requestIdValue, 409, "IDEMPOTENCY_CONFLICT", "Operation ID was already used with a different set update.");
    if (operation.state === "replay") return apiSuccess(requestIdValue, operation.record.response_body, undefined, { replayed: true });
    const result = await upsertWorkoutSet(context.db, context.user.id, id, setId, parsed.data);
    if (result.state === "not_found" || result.state === "exercise_not_found") return apiError(requestIdValue, 404, "NOT_FOUND", "Workout session or exercise was not found.");
    if (result.state === "completed") return apiError(requestIdValue, 409, "CONFLICT", "Completed workouts cannot accept new sets.");
    const response = { ...result, operationId: parsed.data.operationId, revision: Number(parsed.data.baseRevision ?? 0) + 1, acknowledgedAt: new Date().toISOString() };
    await recordOperation(context.db, { userId: context.user.id, scope, operationId: parsed.data.operationId, payloadHash: operation.hash, responseBody: response, statusCode: 200, resourceRevision: response.revision });
    return apiSuccess(requestIdValue, response);
  } catch { return apiError(requestIdValue, 503, "SERVICE_UNAVAILABLE", "Set update could not be saved."); }
}
