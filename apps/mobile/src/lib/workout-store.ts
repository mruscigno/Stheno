import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import { createPortableUuid, SthenoApiError } from "@shared/client/api-client";
import { createMobileApiClient } from "./api";
import { canonicalJson, retryDelayMs, shouldPreserveAsConflict } from "./workout-sync-policy";

export type LocalWorkoutSet = { setId: string; exerciseSlug: string; ordinal: number; load: number | null; loadUnit: "lb" | "kg"; reps: number | null; rir: number | null; state: "planned" | "completed" | "skipped"; syncState: "local" | "pending" | "synced" | "conflict" };
export type LocalWorkout = { userId: string; localSessionKey: string; serverSessionId: string | null; workoutKey: string; workout: Record<string, unknown>; status: "active" | "completed" | "conflict"; serverRevision: number; startedAt: string; restExpiresAt: string | null; sets: LocalWorkoutSet[]; pendingCount: number; lastError: string | null };
type PendingOperation = { user_id: string; operation_id: string; local_session_key: string; server_session_id: string | null; kind: "start" | "upsert_set" | "substitute" | "complete"; payload_json: string; retry_count: number };

const DATABASE_NAME = "stheno-workouts-v1.db";
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  const db = await databasePromise;
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workout_store_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS local_workout_sessions (
      user_id TEXT NOT NULL, local_session_key TEXT NOT NULL, server_session_id TEXT, workout_key TEXT NOT NULL,
      workout_json TEXT NOT NULL, status TEXT NOT NULL, server_revision INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL, rest_expires_at TEXT, last_error TEXT, updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, local_session_key));
    CREATE UNIQUE INDEX IF NOT EXISTS local_workout_server_id ON local_workout_sessions(user_id, server_session_id) WHERE server_session_id IS NOT NULL;
    CREATE TABLE IF NOT EXISTS local_workout_sets (
      user_id TEXT NOT NULL, local_session_key TEXT NOT NULL, set_id TEXT NOT NULL, exercise_slug TEXT NOT NULL,
      ordinal INTEGER NOT NULL, load REAL, load_unit TEXT NOT NULL, reps INTEGER, rir REAL, state TEXT NOT NULL,
      sync_state TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id, local_session_key, set_id),
      FOREIGN KEY(user_id, local_session_key) REFERENCES local_workout_sessions(user_id, local_session_key) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS workout_pending_operations (
      user_id TEXT NOT NULL, operation_id TEXT NOT NULL, local_session_key TEXT NOT NULL, server_session_id TEXT,
      kind TEXT NOT NULL, payload_json TEXT NOT NULL, payload_hash TEXT NOT NULL, state TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT NOT NULL, last_error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, operation_id));
    CREATE INDEX IF NOT EXISTS workout_pending_ready ON workout_pending_operations(user_id, state, next_attempt_at, created_at);
    CREATE TABLE IF NOT EXISTS workout_local_receipts (
      user_id TEXT NOT NULL, operation_id TEXT NOT NULL, server_session_id TEXT NOT NULL, revision INTEGER NOT NULL,
      server_timestamp TEXT NOT NULL, result_json TEXT NOT NULL, PRIMARY KEY(user_id, operation_id));
    INSERT OR REPLACE INTO workout_store_meta(key,value) VALUES('schema_version','1');
    PRAGMA user_version = 1;`);
  return db;
}

async function payloadHash(payload: unknown) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonicalJson(payload)); }
function now() { return new Date().toISOString(); }

async function enqueue(db: SQLite.SQLiteDatabase, userId: string, localSessionKey: string, kind: PendingOperation["kind"], payload: Record<string, unknown>, serverSessionId: string | null = null) {
  const operationId = createPortableUuid(), createdAt = now(), hash = await payloadHash(payload);
  await db.runAsync(`INSERT INTO workout_pending_operations(user_id,operation_id,local_session_key,server_session_id,kind,payload_json,payload_hash,state,retry_count,next_attempt_at,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, userId, operationId, localSessionKey, serverSessionId, kind, JSON.stringify(payload), hash, "pending", 0, createdAt, createdAt, createdAt);
  return operationId;
}

export async function createLocalWorkout(userId: string, workoutKey: string, workout: Record<string, unknown>) {
  const db = await database(), localSessionKey = createPortableUuid(), createdAt = now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`INSERT INTO local_workout_sessions(user_id,local_session_key,workout_key,workout_json,status,started_at,updated_at) VALUES(?,?,?,?,?,?,?)`, userId, localSessionKey, workoutKey, JSON.stringify(workout), "active", createdAt, createdAt);
    await enqueue(db, userId, localSessionKey, "start", { workoutKey, clientSessionKey: localSessionKey, clientCreatedAt: createdAt });
  });
  return localSessionKey;
}

export async function adoptServerWorkout(userId:string, session:{id:string;workout_key:string;original_workout:unknown;revised_workout:unknown;revision:number;started_at:string}){
  const db=await database(),localSessionKey=createPortableUuid(),workout=(session.revised_workout??session.original_workout) as Record<string,unknown>;
  await db.runAsync(`INSERT OR IGNORE INTO local_workout_sessions(user_id,local_session_key,server_session_id,workout_key,workout_json,status,server_revision,started_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`,userId,localSessionKey,session.id,session.workout_key,JSON.stringify(workout),"active",session.revision,session.started_at,now());
  const found=await db.getFirstAsync<{local_session_key:string}>("SELECT local_session_key FROM local_workout_sessions WHERE user_id=? AND server_session_id=?",userId,session.id);
  return found?.local_session_key??localSessionKey;
}

export async function saveLocalSet(userId: string, localSessionKey: string, input: Omit<LocalWorkoutSet, "syncState">) {
  const db = await database(), updatedAt = now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`INSERT INTO local_workout_sets(user_id,local_session_key,set_id,exercise_slug,ordinal,load,load_unit,reps,rir,state,sync_state,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,local_session_key,set_id) DO UPDATE SET load=excluded.load,reps=excluded.reps,rir=excluded.rir,state=excluded.state,sync_state='pending',updated_at=excluded.updated_at`,
      userId, localSessionKey, input.setId, input.exerciseSlug, input.ordinal, input.load, input.loadUnit, input.reps, input.rir, input.state, "pending", updatedAt);
    await enqueue(db, userId, localSessionKey, "upsert_set", { ...input, clientCreatedAt: updatedAt });
  });
}

export async function setRestDeadline(userId: string, localSessionKey: string, restExpiresAt: string | null) { const db=await database(); await db.runAsync("UPDATE local_workout_sessions SET rest_expires_at=?,updated_at=? WHERE user_id=? AND local_session_key=?",restExpiresAt,now(),userId,localSessionKey); }

export async function completeLocalWorkout(userId: string, localSessionKey: string, effort: "too_easy"|"about_right"|"very_hard"|"couldnt_finish", allowIncomplete: boolean) {
  const db=await database(), createdAt=now();
  await db.withTransactionAsync(async()=>{ await enqueue(db,userId,localSessionKey,"complete",{effort,allowIncomplete,clientCreatedAt:createdAt}); await db.runAsync("UPDATE local_workout_sessions SET status='completed',updated_at=? WHERE user_id=? AND local_session_key=?",createdAt,userId,localSessionKey); });
}

export async function substituteLocalExercise(userId:string,localSessionKey:string,exerciseSlug:string,replacementSlug:string,replacementName:string){
  const db=await database(),session=await db.getFirstAsync<{workout_json:string}>("SELECT workout_json FROM local_workout_sessions WHERE user_id=? AND local_session_key=?",userId,localSessionKey);if(!session)throw new Error("Workout not found");
  const workout=JSON.parse(session.workout_json) as Record<string,unknown>,items=Array.isArray(workout.exercises)?workout.exercises as Record<string,unknown>[]:[];
  const revised={...workout,exercises:items.map(item=>item.exerciseSlug===exerciseSlug?{...item,exerciseSlug:replacementSlug,exerciseName:replacementName}:item)},updatedAt=now();
  await db.withTransactionAsync(async()=>{await db.runAsync("UPDATE local_workout_sessions SET workout_json=?,updated_at=? WHERE user_id=? AND local_session_key=?",JSON.stringify(revised),updatedAt,userId,localSessionKey);await enqueue(db,userId,localSessionKey,"substitute",{exerciseSlug,replacementSlug,reason:"Member selected reviewed alternative",clientCreatedAt:updatedAt});});
}

export async function getLocalWorkout(userId: string, localSessionKey?: string): Promise<LocalWorkout|null> {
  const db=await database();
  const session=localSessionKey
    ? await db.getFirstAsync<Record<string,unknown>>("SELECT * FROM local_workout_sessions WHERE user_id=? AND local_session_key=?",userId,localSessionKey)
    : await db.getFirstAsync<Record<string,unknown>>("SELECT * FROM local_workout_sessions WHERE user_id=? AND status IN ('active','conflict') ORDER BY updated_at DESC LIMIT 1",userId);
  if(!session)return null;
  const key=String(session.local_session_key), rows=await db.getAllAsync<Record<string,unknown>>("SELECT * FROM local_workout_sets WHERE user_id=? AND local_session_key=? ORDER BY exercise_slug,ordinal",userId,key);
  const pending=await db.getFirstAsync<{count:number}>("SELECT count(*) AS count FROM workout_pending_operations WHERE user_id=? AND local_session_key=? AND state IN ('pending','sending','conflict')",userId,key);
  return {userId,localSessionKey:key,serverSessionId:session.server_session_id?String(session.server_session_id):null,workoutKey:String(session.workout_key),workout:JSON.parse(String(session.workout_json)),status:session.status as LocalWorkout["status"],serverRevision:Number(session.server_revision),startedAt:String(session.started_at),restExpiresAt:session.rest_expires_at?String(session.rest_expires_at):null,pendingCount:Number(pending?.count??0),lastError:session.last_error?String(session.last_error):null,sets:rows.map(row=>({setId:String(row.set_id),exerciseSlug:String(row.exercise_slug),ordinal:Number(row.ordinal),load:row.load==null?null:Number(row.load),loadUnit:row.load_unit as "lb"|"kg",reps:row.reps==null?null:Number(row.reps),rir:row.rir==null?null:Number(row.rir),state:row.state as LocalWorkoutSet["state"],syncState:row.sync_state as LocalWorkoutSet["syncState"]}))};
}

async function commitReceipt(db:SQLite.SQLiteDatabase,userId:string,operation:PendingOperation,receipt:{sessionId:string;revision:number;serverTimestamp:string;result:unknown}){
  await db.withTransactionAsync(async()=>{
    await db.runAsync("INSERT OR REPLACE INTO workout_local_receipts(user_id,operation_id,server_session_id,revision,server_timestamp,result_json) VALUES(?,?,?,?,?,?)",userId,operation.operation_id,receipt.sessionId,receipt.revision,receipt.serverTimestamp,JSON.stringify(receipt.result));
    await db.runAsync("UPDATE local_workout_sessions SET server_session_id=?,server_revision=?,last_error=NULL,updated_at=? WHERE user_id=? AND local_session_key=?",receipt.sessionId,receipt.revision,now(),userId,operation.local_session_key);
    if(operation.kind==="upsert_set"){const payload=JSON.parse(operation.payload_json) as {setId:string};await db.runAsync("UPDATE local_workout_sets SET sync_state='synced',updated_at=? WHERE user_id=? AND local_session_key=? AND set_id=?",now(),userId,operation.local_session_key,payload.setId);}
    await db.runAsync("DELETE FROM workout_pending_operations WHERE user_id=? AND operation_id=?",userId,operation.operation_id);
  });
}

export async function syncWorkoutOutbox(userId:string){
  const db=await database(),api=createMobileApiClient(); let synced=0;
  const operations=await db.getAllAsync<PendingOperation>("SELECT user_id,operation_id,local_session_key,server_session_id,kind,payload_json,retry_count FROM workout_pending_operations WHERE user_id=? AND state IN ('pending','sending') AND next_attempt_at<=? ORDER BY created_at",userId,now());
  for(const operation of operations){
    const session=await db.getFirstAsync<{server_session_id:string|null;server_revision:number}>("SELECT server_session_id,server_revision FROM local_workout_sessions WHERE user_id=? AND local_session_key=?",userId,operation.local_session_key); if(!session)continue;
    try{
      await db.runAsync("UPDATE workout_pending_operations SET state='sending',updated_at=? WHERE user_id=? AND operation_id=?",now(),userId,operation.operation_id);
      const payload=JSON.parse(operation.payload_json) as Record<string,unknown>; let receipt;
      if(operation.kind==="start") receipt=(await api.startWorkout({operationId:operation.operation_id,clientSessionKey:String(payload.clientSessionKey),workoutKey:String(payload.workoutKey),clientCreatedAt:String(payload.clientCreatedAt)})).data;
      else {
        if(!session.server_session_id) break;
        if(operation.kind==="upsert_set") receipt=(await api.saveWorkoutSet(session.server_session_id,String(payload.setId),{operationId:operation.operation_id,baseRevision:session.server_revision,exerciseSlug:payload.exerciseSlug,setOrdinal:payload.ordinal,setType:"working",prescribed:{},load:payload.load,loadUnit:payload.loadUnit,repetitions:payload.reps,rir:payload.rir,state:payload.state,clientCreatedAt:payload.clientCreatedAt})).data;
        else if(operation.kind==="substitute") receipt=(await api.substituteWorkoutExercise(session.server_session_id,{operationId:operation.operation_id,baseRevision:session.server_revision,exerciseSlug:payload.exerciseSlug,replacementSlug:payload.replacementSlug,reason:payload.reason,clientCreatedAt:payload.clientCreatedAt})).data;
        else receipt=(await api.completeWorkout(session.server_session_id,{operationId:operation.operation_id,baseRevision:session.server_revision,effort:payload.effort,allowIncomplete:payload.allowIncomplete,clientCreatedAt:payload.clientCreatedAt})).data;
      }
      await commitReceipt(db,userId,operation,receipt); synced++;
    }catch(error){
      if(error instanceof SthenoApiError && shouldPreserveAsConflict(error.status)){await db.runAsync("UPDATE workout_pending_operations SET state='conflict',last_error=?,updated_at=? WHERE user_id=? AND operation_id=?",error.message,now(),userId,operation.operation_id);await db.runAsync("UPDATE local_workout_sessions SET status='conflict',last_error=?,updated_at=? WHERE user_id=? AND local_session_key=?",error.message,now(),userId,operation.local_session_key);break;}
      try{if(session.server_session_id){const receipt=(await api.workoutReceipt(operation.operation_id)).data;await commitReceipt(db,userId,operation,receipt);synced++;continue;}}catch{}
      const retry=operation.retry_count+1,next=new Date(Date.now()+retryDelayMs(retry)).toISOString(); await db.runAsync("UPDATE workout_pending_operations SET state='pending',retry_count=?,next_attempt_at=?,last_error=?,updated_at=? WHERE user_id=? AND operation_id=?",retry,next,error instanceof Error?error.message:"Network error",now(),userId,operation.operation_id); break;
    }
  }
  return synced;
}

export async function pendingWorkoutCount(userId:string){const db=await database(),row=await db.getFirstAsync<{count:number}>("SELECT count(*) AS count FROM workout_pending_operations WHERE user_id=?",userId);return Number(row?.count??0);}
