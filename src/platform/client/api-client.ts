import type { ApiFailure, ApiSuccess } from "@/platform/contracts/api";

export class SthenoApiError extends Error {
  constructor(public readonly status: number, public readonly response: ApiFailure) {
    super(response.error.message);
  }
}

export type SthenoApiClientOptions = {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  fetchImplementation?: typeof fetch;
};

export function createSthenoApiClient(options: SthenoApiClientOptions) {
  const fetcher = options.fetchImplementation ?? fetch;
  async function request<T>(path: string, init: RequestInit = {}) {
    const token = await options.getAccessToken();
    const response = await fetcher(new URL(path, options.baseUrl), {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        "x-request-id": crypto.randomUUID(),
        ...init.headers,
      },
    });
    const body = await response.json() as ApiSuccess<T> | ApiFailure;
    if (!response.ok) throw new SthenoApiError(response.status, body as ApiFailure);
    return body as ApiSuccess<T>;
  }
  return {
    request,
    me: () => request<unknown>("/api/v1/me"),
    today: () => request<unknown>("/api/v1/today"),
    program: () => request<unknown>("/api/v1/program"),
    nutrition: () => request<unknown>("/api/v1/nutrition"),
    progress: () => request<unknown>("/api/v1/progress"),
    exercises: (query = "") => request<unknown[]>(`/api/v1/exercises${query ? `?${query}` : ""}`),
  };
}
