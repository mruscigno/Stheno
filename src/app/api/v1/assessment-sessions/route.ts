import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ASSESSMENT_VERSION, intakeSteps } from "@/modules/acquisition/assessment-model";
import { expiresAt, hashCapability, issueCapability } from "@/modules/acquisition/anonymous-session";

export async function POST(request: Request) {
  const id=requestId(request), admin=createSupabaseAdminClient();
  if(!admin) return apiError(id,503,"SERVICE_UNAVAILABLE","Anonymous assessment storage is unavailable.");
  const capability=issueCapability(), expiry=expiresAt();
  const {data,error}=await admin.from("anonymous_assessment_sessions").insert({capability_hash:hashCapability(capability),schema_version:ASSESSMENT_VERSION,current_step_key:intakeSteps[0]?.key,expires_at:expiry}).select("id,state,revision,current_step_key,expires_at").single();
  if(error) return apiError(id,503,"SERVICE_UNAVAILABLE","Unable to start the assessment.");
  return apiSuccess(id,{sessionId:data.id,capability,state:data.state,revision:Number(data.revision),currentStepKey:data.current_step_key,answers:{},expiresAt:data.expires_at,schemaVersion:ASSESSMENT_VERSION},{status:201});
}
