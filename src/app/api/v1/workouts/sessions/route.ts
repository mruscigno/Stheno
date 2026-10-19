import { StartWorkoutInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { findOperation, recordOperation } from "@/platform/server/idempotency";
import { startWorkout } from "@/platform/server/workouts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const id = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  const parsed = await parseJson(request, StartWorkoutInput);
  if (parsed.error) return apiError(id, 400, "VALIDATION_FAILED", "Invalid workout request.", parsed.error);
  const scope = "workout:start";
  try {
    const operation = await findOperation(context.db, context.user.id, scope, parsed.data.operationId, parsed.data);
    if (operation.state === "conflict") return apiError(id, 409, "IDEMPOTENCY_CONFLICT", "Operation ID was already used with a different request.");
    if (operation.state === "replay") return apiSuccess(id, operation.record.response_body, { status: operation.record.status_code }, { replayed: true });
    const result = await startWorkout(context.db, context.user.id, parsed.data);
    if (!result) return apiError(id, 409, "CONFLICT", "No matching workout is available.");
    const response = { ...result, operationId: parsed.data.operationId, revision: 1, acknowledgedAt: new Date().toISOString() };
    await recordOperation(context.db, { userId: context.user.id, scope, operationId: parsed.data.operationId, payloadHash: operation.hash, responseBody: response, statusCode: result.resumed ? 200 : 201, resourceRevision: 1 });
    return apiSuccess(id, response, { status: result.resumed ? 200 : 201 });
  } catch { return apiError(id, 503, "SERVICE_UNAVAILABLE", "Workout could not be started."); }
}
