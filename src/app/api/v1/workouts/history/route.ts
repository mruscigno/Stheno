import { authorizeMemberRequest } from "@/platform/server/auth";
import { apiError, apiSuccess, requestId } from "@/platform/server/http";

export const dynamic="force-dynamic";
export async function GET(request:Request){
  const rid=requestId(request),authorization=await authorizeMemberRequest(request);
  if(!authorization.context)return apiError(rid,401,"AUTH_REQUIRED","Authentication is required.");
  if(authorization.state==="expired")return apiError(rid,402,"ACCESS_EXPIRED","Membership access is required.",{upgradeUrl:"/pricing"});
  const slugs=(new URL(request.url).searchParams.get("exerciseSlugs")??"").split(",").map(value=>value.trim()).filter(Boolean).slice(0,30);
  if(!slugs.length)return apiSuccess(rid,{});
  const {data,error}=await authorization.context.db.from("workout_set_logs").select("exercise_slug,set_ordinal,load_value,load_unit,repetitions,rir,performed_at").eq("user_id",authorization.context.user.id).in("exercise_slug",slugs).eq("state","completed").is("deleted_at",null).order("performed_at",{ascending:false}).limit(300);
  if(error)return apiError(rid,503,"SERVICE_UNAVAILABLE","Workout history could not be loaded.");
  const latest:Record<string,typeof data>=Object.create(null);
  for(const row of data??[]){if(!latest[row.exercise_slug])latest[row.exercise_slug]=[];if((latest[row.exercise_slug]?.length??0)<8)latest[row.exercise_slug]?.push(row);}
  return apiSuccess(rid,latest);
}
