"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/config/env";

export function createSupabaseBrowserClient() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
