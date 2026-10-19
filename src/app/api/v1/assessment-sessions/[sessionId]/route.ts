import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashCapability, readCapability } from "@/modules/acquisition/anonymous-session";

export async function GET(request:Request,{params}:{params:Promise<{sessionId:string}>}){
 const id=requestId(request),cap=readCapability(request),{sessionId}=await params,admin=createSupabaseAdminClient();
 if(!cap) return apiError(id,401,"AUTH_REQUIRED","Assessment capability required.");
 if(!admin) return apiError(id,503,"SERVICE_UNAVAILABLE","Assessment storage unavailable.");
 const{data,error}=await admin.from("anonymous_assessment_sessions").select("id,schema_version,state,revision,current_step_key,answers,blueprint,expires_at,claimed_at").eq("id",sessionId).eq("capability_hash",hashCapability(cap)).maybeSingle();
 if(error||!data) return apiError(id,404,"NOT_FOUND","Assessment session not found.");
 if(new Date(data.expires_at)<=new Date()) return apiError(id,410,"NOT_FOUND","Assessment session expired.");
 return apiSuccess(id,{sessionId:data.id,schemaVersion:data.schema_version,state:data.state,revision:Number(data.revision),currentStepKey:data.current_step_key,answers:data.answers,blueprint:data.blueprint??undefined,expiresAt:data.expires_at,claimedAt:data.claimed_at});
}
