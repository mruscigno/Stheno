import { createSthenoApiClient, SthenoApiError } from "@shared/client/api-client";
import { readEnvironment } from "./env";
import { getSupabaseClient } from "./supabase";

export function createMobileApiClient() {
  const env = readEnvironment();
  return createSthenoApiClient({
    baseUrl: env.EXPO_PUBLIC_API_BASE_URL,
    getAccessToken: async () => (await getSupabaseClient().auth.getSession()).data.session?.access_token ?? null,
  });
}

export function safeApiMessage(error: unknown) {
  if (error instanceof SthenoApiError) {
    if (error.status === 401) return "Your session expired. Sign in again to continue.";
    if (error.status === 402) return "Your membership needs attention before member features can load.";
    if (error.status === 429) return "Too many attempts. Wait a moment and try again.";
  }
  if (error instanceof TypeError) return "You appear to be offline. Check your connection and try again.";
  return "STHENO could not load this right now. Your account data is safe.";
}
