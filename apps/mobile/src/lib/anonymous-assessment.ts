import { secureSessionStorage } from "./secure-store";
import { readEnvironment } from "./env";

const key="stheno.anonymous-assessment.v1";
export type Capability={sessionId:string;capability:string};
export type SessionState=Capability&{schemaVersion:string;state:"in_progress"|"finalized"|"claimed";revision:number;currentStepKey:string|null;answers:Record<string,string|number|string[]>;blueprint?:unknown;expiresAt:string};
type Envelope<T>={data:T;error?:{message:string}};
async function call<T>(path:string,init:RequestInit={},capability?:Capability){const base=readEnvironment().EXPO_PUBLIC_API_BASE_URL.replace(/\/$/,"");const response=await fetch(`${base}${path}`,{...init,headers:{"content-type":"application/json",...(capability?{"x-stheno-assessment-capability":capability.capability}:{}),...init.headers}});const body=await response.json() as Envelope<T>;if(!response.ok)throw new Error(body.error?.message??"Assessment request failed");return body.data;}
export async function loadCapability(){const raw=await secureSessionStorage.getItem(key);if(!raw)return null;try{const value=JSON.parse(raw) as Capability;return value.sessionId&&value.capability?value:null}catch{return null}}
export async function createSession(){const data=await call<SessionState>("/api/v1/assessment-sessions",{method:"POST",body:"{}"});const capability={sessionId:data.sessionId,capability:data.capability};await secureSessionStorage.setItem(key,JSON.stringify(capability));return data;}
export async function resumeSession(capability:Capability){const session=await call<Omit<SessionState,keyof Capability>>(`/api/v1/assessment-sessions/${capability.sessionId}`,{},capability);return{...session,...capability}}
export async function saveAnswers(session:SessionState,answers:SessionState["answers"],currentStepKey:string|null){const result=await call<{revision:number}>(`/api/v1/assessment-sessions/${session.sessionId}/answers`,{method:"PUT",body:JSON.stringify({revision:session.revision,currentStepKey,answers})},session);return{...session,answers,currentStepKey,revision:result.revision}}
export async function finalizeSession(session:SessionState){const result=await call<{revision:number;blueprint:unknown}>(`/api/v1/assessment-sessions/${session.sessionId}/finalize`,{method:"POST",body:"{}"},session);return{...session,state:"finalized" as const,currentStepKey:null,revision:result.revision,blueprint:result.blueprint}}
export async function claimSession(session:SessionState,accessToken:string){return call<{claimed:boolean;program:unknown}>(`/api/v1/assessment-sessions/${session.sessionId}/claim`,{method:"POST",body:"{}",headers:{authorization:`Bearer ${accessToken}`}},session)}
export async function clearAssessmentCapability(){await secureSessionStorage.removeItem(key)}
