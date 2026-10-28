import { SthenoApiError } from "@shared/client/api-client";

export type AuthBootstrapStatus = "signedIn" | "authenticatedOffline" | "reauthRequired" | "error";

export function classifyAuthenticatedBootstrap(error: unknown, networkAvailable: boolean): AuthBootstrapStatus {
  if (!networkAvailable) return "authenticatedOffline";
  if (error instanceof SthenoApiError && error.status === 401) return "reauthRequired";
  if (error instanceof TypeError) return "authenticatedOffline";
  if (error instanceof Error && (error.name === "AbortError" || /network request failed|fetch failed/i.test(error.message))) return "authenticatedOffline";
  return "error";
}

export function canUseLocalMemberData(status: AuthBootstrapStatus | "loading" | "signedOut") {
  return status === "signedIn" || status === "authenticatedOffline";
}
