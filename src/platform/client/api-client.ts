import type { AdaptationIntent, AdaptationPreview, AdaptationScope, ApiFailure, ApiSuccess, CoachConversation, CoachReply, MemberReadModel, NutritionReadModel, ProgramReadModel, ProgressReadModel, TodayReadModel, WorkoutOperationReceipt, WorkoutSessionReadModel } from "../contracts/api";

export class SthenoApiError extends Error {
  constructor(public readonly status: number, public readonly response: ApiFailure) {
    super(response.error.message);
  }
}

export type SthenoApiClientOptions = {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
};

type RandomUuidProvider = { randomUUID?: () => string } | undefined;

// Hermes does not guarantee a Web Crypto global. These UUIDs identify requests
// and idempotent operations; they are not authentication secrets.
export function createPortableUuid(provider: RandomUuidProvider = globalThis.crypto) {
  if (typeof provider?.randomUUID === "function") return provider.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    return (token === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}

export function createSthenoApiClient(options: SthenoApiClientOptions) {
  const fetcher = options.fetchImplementation ?? fetch;
  async function request<T>(path: string, init: RequestInit = {}) {
    const token = await options.getAccessToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
    const execute = () => fetcher(new URL(path, options.baseUrl), {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        "x-request-id": createPortableUuid(),
        ...init.headers,
      },
    });
    let response: Response;
    try {
      response = await execute();
      if (!response.ok && [502, 503, 504].includes(response.status) && (!init.method || init.method === "GET")) response = await execute();
    } finally { clearTimeout(timeout); }
    const body = await response.json() as ApiSuccess<T> | ApiFailure;
    if (!response.ok) throw new SthenoApiError(response.status, body as ApiFailure);
    return body as ApiSuccess<T>;
  }
  return {
    request,
    me: () => request<MemberReadModel>("/api/v1/me"),
    today: () => request<TodayReadModel>("/api/v1/today"),
    program: () => request<ProgramReadModel>("/api/v1/program"),
    nutrition: () => request<NutritionReadModel>("/api/v1/nutrition"),
    progress: () => request<ProgressReadModel>("/api/v1/progress"),
    monthlyReviews: () => request<{ state: Record<string, unknown> | null; reviews: Array<Record<string, unknown>>; recommendations: Array<Record<string, unknown>> }>("/api/v1/monthly-reviews"),
    startMonthlyReview: () => request<Record<string, unknown>>("/api/v1/monthly-reviews", { method: "POST", body: JSON.stringify({ action: "start" }) }),
    saveMonthlyReview: (reviewId: string, input: { operationId: string; baseRevision: number; intake: Record<string, unknown> }) => request<Record<string, unknown>>(`/api/v1/monthly-reviews/${reviewId}`, { method: "PATCH", body: JSON.stringify(input) }),
    decideMonthlyReview: (reviewId: string, input: { operationId: string; action: "apply" | "keep"; acceptedIds: string[] }) => request<{ accepted: string[]; declined: string[] }>(`/api/v1/monthly-reviews/${reviewId}/decisions`, { method: "POST", body: JSON.stringify(input) }),
    progressPhotos: () => request<{ sets: Array<Record<string, unknown>>; signedUrlTtlSeconds: number }>("/api/v1/progress/photos"),
    createProgressPhotoSet: (monthlyReviewId?: string) => request<Record<string, unknown>>("/api/v1/progress/photos", { method: "POST", body: JSON.stringify({ action: "create", monthlyReviewId, consentVersion: "progress-photos-v1" }) }),
    completeProgressPhotoSet: (setId: string) => request<Record<string, unknown>>("/api/v1/progress/photos", { method: "POST", body: JSON.stringify({ action: "complete", setId }) }),
    uploadProgressPhoto: (setId: string, view: "front" | "left" | "back" | "right", file: Blob, filename: string) => { const form = new FormData(); form.append("setId", setId); form.append("view", view); form.append("file", file, filename); return request<Record<string, unknown>>("/api/v1/progress/photos", { method: "PUT", body: form }); },
    deleteProgressPhotos: (setId?: string) => request<{ deletedFiles: number }>("/api/v1/progress/photos", { method: "DELETE", body: JSON.stringify(setId ? { action: "delete_set", setId } : { action: "delete_all" }) }),
    coachHistory: () => request<{ conversations: CoachConversation[] }>("/api/v1/coach/questions"),
    askCoach: (message: string, conversationId?: string) => request<CoachReply>("/api/v1/coach/questions", { method: "POST", body: JSON.stringify({ message, conversationId }) }),
    previewAdaptation: (intent: AdaptationIntent, scope: AdaptationScope, details?: string) => request<AdaptationPreview>("/api/v1/adaptations/preview", { method: "POST", body: JSON.stringify({ intent, scope, details }) }),
    decideAdaptation: (requestId: string, decision: "confirmed" | "cancelled") => request<{ status: string }>("/api/v1/adaptations/decision", { method: "POST", body: JSON.stringify({ requestId, decision }) }),
    updatePreferences: (preferences: { unitSystem?: "imperial" | "metric"; locale?: string; timeZone?: string }) => request<MemberReadModel>("/api/v1/me", { method: "PATCH", body: JSON.stringify(preferences) }),
    exercises: (query = "") => request<unknown[]>(`/api/v1/exercises${query ? `?${query}` : ""}`),
    startWorkout: (input:{operationId:string;clientSessionKey:string;workoutKey?:string;clientCreatedAt?:string}) => request<WorkoutOperationReceipt<unknown>>("/api/v1/workouts/sessions",{method:"POST",body:JSON.stringify(input)}),
    workoutSession: (sessionId:string) => request<WorkoutSessionReadModel>(`/api/v1/workouts/sessions/${sessionId}`),
    workoutHistory: (exerciseSlugs:string[]) => request<Record<string,Array<{set_ordinal:number;load_value:number|null;load_unit:string;repetitions:number|null;rir:number|null;performed_at:string}>>>(`/api/v1/workouts/history?exerciseSlugs=${encodeURIComponent(exerciseSlugs.join(","))}`),
    substituteWorkoutExercise:(sessionId:string,input:Record<string,unknown>)=>request<WorkoutOperationReceipt<unknown>>(`/api/v1/workouts/sessions/${sessionId}/substitute`,{method:"POST",body:JSON.stringify(input)}),
    saveWorkoutSet: (sessionId:string,setId:string,input:Record<string,unknown>) => request<WorkoutOperationReceipt<unknown>>(`/api/v1/workouts/sessions/${sessionId}/sets/${setId}`,{method:"PUT",body:JSON.stringify(input)}),
    deleteWorkoutSet: (sessionId:string,setId:string,input:Record<string,unknown>) => request<WorkoutOperationReceipt<unknown>>(`/api/v1/workouts/sessions/${sessionId}/sets/${setId}`,{method:"DELETE",body:JSON.stringify(input)}),
    completeWorkout: (sessionId:string,input:Record<string,unknown>) => request<WorkoutOperationReceipt<unknown>>(`/api/v1/workouts/sessions/${sessionId}/complete`,{method:"POST",body:JSON.stringify(input)}),
    workoutReceipt: (operationId:string) => request<WorkoutOperationReceipt<unknown>>(`/api/v1/workouts/operations/${operationId}`),
  };
}
