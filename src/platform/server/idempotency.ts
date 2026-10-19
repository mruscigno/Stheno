import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { payloadHash } from "@/platform/server/payload-hash";

export async function findOperation(db: SupabaseClient, userId: string, scope: string, operationId: string, payload: unknown) {
  const hash = payloadHash(payload);
  const { data, error } = await db.from("api_idempotency_records").select("payload_hash,response_body,status_code,resource_revision,completed_at").eq("user_id", userId).eq("scope", scope).eq("operation_id", operationId).maybeSingle();
  if (error) throw new Error(`IDEMPOTENCY_LOOKUP_FAILED:${error.message}`);
  if (!data) return { state: "new" as const, hash };
  return data.payload_hash === hash ? { state: "replay" as const, record: data, hash } : { state: "conflict" as const, hash };
}

export async function recordOperation(db: SupabaseClient, input: { userId: string; scope: string; operationId: string; payloadHash: string; responseBody: unknown; statusCode: number; resourceRevision: number }) {
  const { error } = await db.from("api_idempotency_records").insert({ user_id: input.userId, scope: input.scope, operation_id: input.operationId, payload_hash: input.payloadHash, response_body: input.responseBody, status_code: input.statusCode, resource_revision: input.resourceRevision });
  if (error?.code === "23505") return false;
  if (error) throw new Error(`IDEMPOTENCY_RECORD_FAILED:${error.message}`);
  return true;
}
