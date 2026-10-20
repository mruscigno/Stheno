import { StartWorkoutInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { applyWorkoutOperation, workoutOperationError } from "@/platform/server/workout-operations";
import type { TrainingProgram } from "@/modules/training/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const id = requestId(request), authorization = await authorizeMemberRequest(request);
  if (!authorization.context) return apiError(id, 401, "AUTH_REQUIRED", "Authentication is required.");
  if (authorization.state === "expired") return apiError(id, 402, "ACCESS_EXPIRED", "Membership access is required.", { upgradeUrl: "/pricing" });
  const context = authorization.context;
  const parsed = await parseJson(request, StartWorkoutInput);
  if (parsed.error) return apiError(id, 400, "VALIDATION_FAILED", "Invalid workout request.", parsed.error);
  try {
    const {data:prescription,error}=await context.db.from("program_prescriptions").select("id,prescription").eq("user_id",context.user.id).order("prescribed_at",{ascending:false}).limit(1).maybeSingle();
    if(error||!prescription) return apiError(id,409,"CONFLICT","No training program is available.");
    const program=prescription.prescription as TrainingProgram;
    const workout=parsed.data.workoutKey?program.workouts.find(item=>item.key===parsed.data.workoutKey):program.workouts[0];
    if(!workout) return apiError(id,409,"CONFLICT","No matching workout is available.");
    const sessionId=crypto.randomUUID();
    const result=await applyWorkoutOperation(context.db,{operationId:parsed.data.operationId,sessionId,kind:"start_session",baseRevision:null,schemaVersion:parsed.data.schemaVersion,clientCreatedAt:parsed.data.clientCreatedAt,payload:{programPrescriptionId:prescription.id,workoutKey:workout.key,workout,clientSessionKey:parsed.data.clientSessionKey}});
    return apiSuccess(id,result,{status:result.replayed?200:201});
  } catch(error) { const mapped=workoutOperationError(error); return apiError(id,mapped.status,mapped.code,mapped.message,mapped.details); }
}
