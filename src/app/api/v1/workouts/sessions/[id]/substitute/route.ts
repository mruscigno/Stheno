import { SubstituteWorkoutExerciseInput } from "@/platform/contracts/api";
import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { applyWorkoutOperation, workoutOperationError } from "@/platform/server/workout-operations";

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  const rid=requestId(request),authorization=await authorizeMemberRequest(request);
  if(!authorization.context)return apiError(rid,401,"AUTH_REQUIRED","Authentication is required.");
  if(authorization.state==="expired")return apiError(rid,402,"ACCESS_EXPIRED","Membership access is required.",{upgradeUrl:"/pricing"});
  const parsed=await parseJson(request,SubstituteWorkoutExerciseInput);if(parsed.error)return apiError(rid,400,"VALIDATION_FAILED","Invalid substitution request.",parsed.error);
  const {id}=await context.params,db=authorization.context.db,userId=authorization.context.user.id;
  const [session,exerciseRows]=await Promise.all([
    db.from("workout_execution_sessions").select("original_workout,revised_workout").eq("id",id).eq("user_id",userId).is("deleted_at",null).maybeSingle(),
    db.from("exercises").select("id,slug,name").in("slug",[parsed.data.exerciseSlug,parsed.data.replacementSlug]),
  ]);
  if(session.error||exerciseRows.error)return apiError(rid,503,"SERVICE_UNAVAILABLE","Substitution could not be checked.");
  if(!session.data)return apiError(rid,404,"NOT_FOUND","Workout was not found.");
  const source=exerciseRows.data?.find(item=>item.slug===parsed.data.exerciseSlug),replacement=exerciseRows.data?.find(item=>item.slug===parsed.data.replacementSlug);
  if(!source||!replacement)return apiError(rid,404,"NOT_FOUND","Exercise was not found.");
  const reviewed=await db.from("exercise_alternatives").select("exercise_id").eq("exercise_id",source.id).eq("alternative_id",replacement.id).eq("review_status","reviewed").maybeSingle();
  if(reviewed.error||!reviewed.data)return apiError(rid,409,"CONFLICT","That replacement is not a reviewed alternative.");
  const current=(session.data.revised_workout??session.data.original_workout) as Record<string,unknown>,items=Array.isArray(current.exercises)?current.exercises as Record<string,unknown>[]:[];
  if(!items.some(item=>item.exerciseSlug===parsed.data.exerciseSlug))return apiError(rid,409,"CONFLICT","The exercise is no longer in this workout.");
  const revisedWorkout={...current,exercises:items.map(item=>item.exerciseSlug===parsed.data.exerciseSlug?{...item,exerciseSlug:replacement.slug,exerciseName:replacement.name}:item)};
  try{const result=await applyWorkoutOperation(db,{operationId:parsed.data.operationId,sessionId:id,kind:"substitute_exercise",baseRevision:parsed.data.baseRevision,schemaVersion:parsed.data.schemaVersion,clientCreatedAt:parsed.data.clientCreatedAt,payload:{revisedWorkout,reason:parsed.data.reason,scope:"session_only",reasonCodes:["member_selected_reviewed_alternative"],safetyClassification:"normal"}});return apiSuccess(rid,result);}
  catch(error){const mapped=workoutOperationError(error);return apiError(rid,mapped.status,mapped.code,mapped.message,mapped.details);}
}
