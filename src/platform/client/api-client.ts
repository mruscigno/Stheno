import type { AdaptationIntent, AdaptationPreview, AdaptationScope, ApiFailure, ApiSuccess, CoachConversation, CoachReply, MemberReadModel, NutritionReadModel, ProgramReadModel, ProgressReadModel, TodayReadModel } from "../contracts/api";

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
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        "x-request-id": crypto.randomUUID(),
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
    coachHistory: () => request<{ conversations: CoachConversation[] }>("/api/v1/coach/questions"),
    askCoach: (message: string, conversationId?: string) => request<CoachReply>("/api/v1/coach/questions", { method: "POST", body: JSON.stringify({ message, conversationId }) }),
    previewAdaptation: (intent: AdaptationIntent, scope: AdaptationScope, details?: string) => request<AdaptationPreview>("/api/v1/adaptations/preview", { method: "POST", body: JSON.stringify({ intent, scope, details }) }),
    decideAdaptation: (requestId: string, decision: "confirmed" | "cancelled") => request<{ status: string }>("/api/v1/adaptations/decision", { method: "POST", body: JSON.stringify({ requestId, decision }) }),
    updatePreferences: (preferences: { unitSystem?: "imperial" | "metric"; locale?: string; timeZone?: string }) => request<MemberReadModel>("/api/v1/me", { method: "PATCH", body: JSON.stringify(preferences) }),
    exercises: (query = "") => request<unknown[]>(`/api/v1/exercises${query ? `?${query}` : ""}`),
  };
}
