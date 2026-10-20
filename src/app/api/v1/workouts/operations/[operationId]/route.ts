import {authorizeMemberRequest} from "@/platform/server/auth";
import {apiError,apiSuccess,requestId} from "@/platform/server/http";

export const dynamic="force-dynamic";

export async function GET(request:Request,{params}:{params:Promise<{operationId:string}>}){
 const id=requestId(request),authorization=await authorizeMemberRequest(request);
 if(!authorization.context)return apiError(id,401,"AUTH_REQUIRED","Authentication is required.");
 const {operationId}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(operationId))return apiError(id,400,"VALIDATION_FAILED","Invalid operation identifier.");
 const {data,error}=await authorization.context.db.rpc("get_workout_operation_receipt",{p_operation_id:operationId});
 if(error)return apiError(id,503,"SERVICE_UNAVAILABLE","Receipt lookup is temporarily unavailable.");
 if(!data)return apiError(id,404,"NOT_FOUND","Operation receipt was not found.");
 return apiSuccess(id,data);
}
