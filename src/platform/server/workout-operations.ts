import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { payloadHash } from "./payload-hash";

export type WorkoutOperationKind = "start_session"|"upsert_set"|"delete_set"|"save_note"|"complete_session"|"substitute_exercise";
export type WorkoutOperationEnvelope = {
  operationId:string; sessionId:string; kind:WorkoutOperationKind; baseRevision:number|null;
  schemaVersion:1; clientCreatedAt?:string; payload:Record<string,unknown>;
};

export async function applyWorkoutOperation(db:SupabaseClient,envelope:WorkoutOperationEnvelope){
  // Start retries receive a new server candidate ID, but must replay the
  // originally committed canonical session rather than hash as new intent.
  const hash=payloadHash({kind:envelope.kind,...(envelope.kind==="start_session"?{}:{sessionId:envelope.sessionId}),baseRevision:envelope.baseRevision,schemaVersion:envelope.schemaVersion,payload:envelope.payload});
  const {data,error}=await db.rpc("apply_workout_operation",{
    p_operation_id:envelope.operationId,p_session_id:envelope.sessionId,p_kind:envelope.kind,
    p_base_revision:envelope.baseRevision,p_schema_version:envelope.schemaVersion,
    p_client_created_at:envelope.clientCreatedAt??null,p_payload:envelope.payload,p_payload_hash:hash,
  });
  if(error) throw new Error(`${error.message}:${error.details??""}`);
  return data;
}

export async function applyWorkoutAdaptation(db:SupabaseClient,envelope:Omit<WorkoutOperationEnvelope,"kind">){
 const hash=payloadHash({kind:"adapt_session",sessionId:envelope.sessionId,baseRevision:envelope.baseRevision,schemaVersion:envelope.schemaVersion,payload:envelope.payload});
 const {data,error}=await db.rpc("apply_workout_adaptation",{p_operation_id:envelope.operationId,p_session_id:envelope.sessionId,p_base_revision:envelope.baseRevision,p_schema_version:envelope.schemaVersion,p_client_created_at:envelope.clientCreatedAt??null,p_payload:envelope.payload,p_payload_hash:hash});
 if(error)throw new Error(`${error.message}:${error.details??""}`);
 return data;
}

export function workoutOperationError(error:unknown){
  const message=error instanceof Error?error.message:String(error);
  if(message.includes("IDEMPOTENCY_CONFLICT")) return {status:409 as const,code:"IDEMPOTENCY_CONFLICT" as const,message:"Operation ID was already committed with different content."};
  if(message.includes("STALE_REVISION")) return {status:409 as const,code:"CONFLICT" as const,message:"Workout changed on another device. Refresh and retry.",details:message.split("STALE_REVISION:")[1]};
  if(message.includes("WORKOUT_ALREADY_COMPLETED")) return {status:409 as const,code:"CONFLICT" as const,message:"This workout is already complete."};
  if(message.includes("TOMBSTONE_CONFLICT")) return {status:409 as const,code:"CONFLICT" as const,message:"This set was deleted on another device. Refresh before changing it."};
  if(message.includes("CONFIRMATION_REQUIRED")) return {status:409 as const,code:"CONFLICT" as const,message:"Planned sets remain. Confirm an incomplete workout before finishing."};
  if(message.includes("WORKOUT_NOT_FOUND")) return {status:404 as const,code:"NOT_FOUND" as const,message:"Workout was not found."};
  return {status:503 as const,code:"SERVICE_UNAVAILABLE" as const,message:"Workout change could not be committed."};
}
