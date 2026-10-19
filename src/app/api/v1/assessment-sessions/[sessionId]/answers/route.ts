import { apiError, apiSuccess, parseJson, requestId } from "@/platform/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashCapability, readCapability, saveAnonymousAnswersSchema } from "@/modules/acquisition/anonymous-session";
import { intakeSteps } from "@/modules/acquisition/assessment-model";

export async function PUT(request:Request,{params}:{params:Promise<{sessionId:string}>}){
 const id=requestId(request),cap=readCapability(request),{sessionId}=await params,admin=createSupabaseAdminClient(),parsed=await parseJson(request,saveAnonymousAnswersSchema);
 if(!cap) return apiError(id,401,"AUTH_REQUIRED","Assessment capability required.");
 if(parsed.error) return apiError(id,400,"VALIDATION_FAILED","Invalid assessment update.",parsed.error);
 if(!admin) return apiError(id,503,"SERVICE_UNAVAILABLE","Assessment storage unavailable.");
 if(parsed.data.currentStepKey&&!intakeSteps.some(step=>step.key===parsed.data.currentStepKey)) return apiError(id,400,"VALIDATION_FAILED","Unknown assessment step.");
 const{data,error}=await admin.from("anonymous_assessment_sessions").update({answers:parsed.data.answers,current_step_key:parsed.data.currentStepKey,revision:parsed.data.revision+1,updated_at:new Date().toISOString()}).eq("id",sessionId).eq("capability_hash",hashCapability(cap)).eq("revision",parsed.data.revision).eq("state","in_progress").gt("expires_at",new Date().toISOString()).select("revision,current_step_key,updated_at").maybeSingle();
 if(error) return apiError(id,503,"SERVICE_UNAVAILABLE","Unable to save assessment progress.");
 if(!data) return apiError(id,409,"CONFLICT","Assessment changed elsewhere. Refresh before retrying.");
 return apiSuccess(id,{saved:true,revision:Number(data.revision),currentStepKey:data.current_step_key,updatedAt:data.updated_at});
}
