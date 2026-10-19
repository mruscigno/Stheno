import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createBlueprint } from "@/modules/acquisition/blueprint";
import { hashCapability, readCapability, toBlueprintInput, validateCompleteIntake } from "@/modules/acquisition/anonymous-session";

export async function POST(request:Request,{params}:{params:Promise<{sessionId:string}>}){
 const id=requestId(request),cap=readCapability(request),{sessionId}=await params,admin=createSupabaseAdminClient();
 if(!cap) return apiError(id,401,"AUTH_REQUIRED","Assessment capability required.");
 if(!admin) return apiError(id,503,"SERVICE_UNAVAILABLE","Assessment storage unavailable.");
 const query=()=>admin.from("anonymous_assessment_sessions").select("id,state,revision,answers,blueprint,expires_at").eq("id",sessionId).eq("capability_hash",hashCapability(cap)).maybeSingle();
 const{data,error}=await query();
 if(error||!data) return apiError(id,404,"NOT_FOUND","Assessment session not found.");
 if(new Date(data.expires_at)<=new Date()) return apiError(id,410,"NOT_FOUND","Assessment session expired.");
 if(data.state==="finalized"||data.state==="claimed") return apiSuccess(id,{finalized:true,replayed:true,revision:Number(data.revision),blueprint:data.blueprint});
 const validation=validateCompleteIntake(data.answers as Record<string,unknown>);
 if(!validation.valid) return apiError(id,422,"VALIDATION_FAILED","Complete the required assessment questions.",{missing:validation.missing,invalid:validation.errors});
 const blueprint=createBlueprint(toBlueprintInput(validation.answers)),now=new Date().toISOString();
 const saved=await admin.from("anonymous_assessment_sessions").update({state:"finalized",blueprint,blueprint_version:blueprint.version,finalized_at:now,current_step_key:null,revision:Number(data.revision)+1,updated_at:now}).eq("id",sessionId).eq("capability_hash",hashCapability(cap)).eq("revision",data.revision).eq("state","in_progress").select("revision,blueprint").maybeSingle();
 if(saved.error) return apiError(id,503,"SERVICE_UNAVAILABLE","Unable to create your Blueprint.");
 if(!saved.data){const latest=await query();if(latest.data?.blueprint)return apiSuccess(id,{finalized:true,replayed:true,revision:Number(latest.data.revision),blueprint:latest.data.blueprint});return apiError(id,409,"CONFLICT","Assessment changed while finalizing. Retry safely.");}
 return apiSuccess(id,{finalized:true,replayed:false,revision:Number(saved.data.revision),blueprint:saved.data.blueprint},{status:201});
}
