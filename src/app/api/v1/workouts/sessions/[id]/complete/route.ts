import { CompleteWorkoutInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { applyWorkoutOperation, workoutOperationError } from "@/platform/server/workout-operations";

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
  try {
    const result=await applyWorkoutOperation(context.db,{operationId:parsed.data.operationId,sessionId:id,kind:"complete_session",baseRevision:parsed.data.baseRevision,schemaVersion:parsed.data.schemaVersion,clientCreatedAt:parsed.data.clientCreatedAt,payload:{effort:parsed.data.effort,note:parsed.data.note,allowIncomplete:parsed.data.allowIncomplete,summary:null,summaryVersion:"app5a"}});
    return apiSuccess(requestIdValue,result);
  } catch(error) { const mapped=workoutOperationError(error); return apiError(requestIdValue,mapped.status,mapped.code,mapped.message,mapped.details); }
}
