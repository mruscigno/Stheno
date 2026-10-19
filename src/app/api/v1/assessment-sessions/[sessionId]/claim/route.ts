import { apiError, apiSuccess, requestId } from "@/platform/server/http";
import { authenticateRequest } from "@/platform/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadCanonicalTrainingLibrary } from "@/lib/exercises/canonical";
import { hashCapability, readCapability, validateCompleteIntake } from "@/modules/acquisition/anonymous-session";
import { publicIntakeToAssessment } from "@/modules/assessment/public-intake";
import { buildPersonalizationProfile, PROFILE_VERSION } from "@/modules/assessment/profile";
import { profileSnapshotToTrainingProfile } from "@/modules/training/profile-adapter";
import { generateProgram } from "@/modules/training/generate";
import { validateProgram } from "@/modules/training/validate";
import { isDateOnly } from "@/modules/programs/start-date";

export async function POST(request:Request,{params}:{params:Promise<{sessionId:string}>}){
 const id=requestId(request),cap=readCapability(request),{sessionId}=await params,auth=await authenticateRequest(request),admin=createSupabaseAdminClient();
 if(!auth) return apiError(id,401,"AUTH_REQUIRED","Sign in before claiming this Blueprint.");
 if(!cap) return apiError(id,401,"AUTH_REQUIRED","Assessment capability required.");
 if(!admin) return apiError(id,503,"SERVICE_UNAVAILABLE","Assessment storage unavailable.");
 const{data:session,error}=await admin.from("anonymous_assessment_sessions").select("state,answers,expires_at,claimed_by").eq("id",sessionId).eq("capability_hash",hashCapability(cap)).maybeSingle();
 if(error||!session) return apiError(id,404,"NOT_FOUND","Assessment session not found.");
 if(new Date(session.expires_at)<=new Date()) return apiError(id,410,"NOT_FOUND","Assessment session expired.");
 if(session.state==="claimed"&&session.claimed_by!==auth.user.id) return apiError(id,409,"CONFLICT","This assessment belongs to another account.");
 const complete=validateCompleteIntake(session.answers as Record<string,unknown>);
 if(!complete.valid) return apiError(id,422,"VALIDATION_FAILED","Assessment is incomplete.");
 const answers=publicIntakeToAssessment(complete.answers),built=buildPersonalizationProfile(answers),start=String(complete.answers.programStartDate??"");
 if(!isDateOnly(start)) return apiError(id,422,"VALIDATION_FAILED","Choose a valid program start date.");
 const trainingProfile=profileSnapshotToTrainingProfile({id:sessionId,assessment_id:sessionId,safety_classification:built.safety.classification,profile:built.profile}),library=await loadCanonicalTrainingLibrary(auth.db),program=generateProgram(trainingProfile,library),validation=validateProgram(program,trainingProfile,library);
 if(!validation.valid) return apiError(id,422,"VALIDATION_FAILED","Program validation failed.",validation);
 const{data:result,error:claimError}=await auth.db.rpc("claim_anonymous_assessment",{p_session_id:sessionId,p_capability_hash:hashCapability(cap),p_user_id:auth.user.id,p_profile:built.profile,p_provenance:built.provenance,p_safety:built.safety.classification,p_program:program,p_validation:validation,p_program_start_date:start,p_profile_version:PROFILE_VERSION,p_engine_version:program.engineVersion,p_ruleset_version:program.rulesetVersion});
 if(claimError){const message=claimError.message??"";if(/another_account|identity_mismatch|invalid_capability/.test(message))return apiError(id,409,"CONFLICT","Assessment cannot be claimed by this account.");return apiError(id,503,"SERVICE_UNAVAILABLE","Unable to claim the assessment safely.");}
 return apiSuccess(id,{...result,program},{status:(result as {replayed?:boolean})?.replayed?200:201});
}
