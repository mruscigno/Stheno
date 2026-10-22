import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnvironment } from "./env";
import { secureSessionStorage } from "./secure-store";

let client: SupabaseClient | null = null;
const webMemory = new Map<string, string>();
const webPreviewStorage = { getItem: async (key: string) => webMemory.get(key) ?? null, setItem: async (key: string, value: string) => { webMemory.set(key, value); }, removeItem: async (key: string) => { webMemory.delete(key); } };

export function getSupabaseClient() {
  if (client) return client;
  const env = readEnvironment();
  client = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { storage: Platform.OS === "web" ? webPreviewStorage : secureSessionStorage, autoRefreshToken: true, persistSession: Platform.OS !== "web", detectSessionInUrl: false, flowType: "pkce" },
  });
  return client;
}

export function installAuthRefreshLifecycle(supabase = getSupabaseClient()) {
  if (Platform.OS === "web") return () => undefined;
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
  supabase.auth.startAutoRefresh();
  return () => { subscription.remove(); supabase.auth.stopAutoRefresh(); };
}

export function resetSupabaseForTests() { client = null; }
