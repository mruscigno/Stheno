import { UpsertWorkoutSetInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { DeleteWorkoutSetInput } from "@/platform/contracts/api";
import { applyWorkoutOperation, workoutOperationError } from "@/platform/server/workout-operations";

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
  try {
    const result=await applyWorkoutOperation(context.db,{operationId:parsed.data.operationId,sessionId:id,kind:"upsert_set",baseRevision:parsed.data.baseRevision,schemaVersion:parsed.data.schemaVersion,clientCreatedAt:parsed.data.clientCreatedAt,payload:{...parsed.data,setId}});
    return apiSuccess(requestIdValue,result);
  } catch(error) { const mapped=workoutOperationError(error); return apiError(requestIdValue,mapped.status,mapped.code,mapped.message,mapped.details); }
}

export async function DELETE(request:Request,{params}:{params:Promise<{id:string;setId:string}>}){
 const rid=requestId(request),authorization=await authorizeMemberRequest(request);
 if(!authorization.context)return apiError(rid,401,"AUTH_REQUIRED","Authentication is required.");
 const parsed=await parseJson(request,DeleteWorkoutSetInput);if(parsed.error)return apiError(rid,400,"VALIDATION_FAILED","Invalid set deletion.",parsed.error);
 const {id,setId}=await params;
 try{return apiSuccess(rid,await applyWorkoutOperation(authorization.context.db,{operationId:parsed.data.operationId,sessionId:id,kind:"delete_set",baseRevision:parsed.data.baseRevision,schemaVersion:parsed.data.schemaVersion,clientCreatedAt:parsed.data.clientCreatedAt,payload:{setId}}));}
 catch(error){const mapped=workoutOperationError(error);return apiError(rid,mapped.status,mapped.code,mapped.message,mapped.details);}
}
