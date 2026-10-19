import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/config/env";
import { evaluateMemberAccess } from "@/modules/access/trial";

export type AuthenticatedContext = { db: SupabaseClient; user: User; authMode: "bearer" | "cookie" };

export function createPublicDataClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }) : null;
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}

export async function authenticateRequest(request: Request): Promise<AuthenticatedContext | null> {
  const token = bearerToken(request);
  if (token) {
    const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
    const key = publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const db = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await db.auth.getUser(token);
    return error || !user ? null : { db, user, authMode: "bearer" };
  }

  const db = await createSupabaseServerClient();
  if (!db) return null;
  const { data: { user }, error } = await db.auth.getUser();
  return error || !user ? null : { db, user, authMode: "cookie" };
}

export async function authorizeMemberRequest(request: Request) {
  const context = await authenticateRequest(request);
  if (!context) return { state: "unauthenticated" as const, context: null, access: null };
  const { data: subscription, error } = await context.db.from("subscriptions").select("status").eq("user_id", context.user.id).eq("status", "active").limit(1).maybeSingle();
  if (error) throw new Error(`ACCESS_LOOKUP_FAILED:${error.message}`);
  const access = evaluateMemberAccess({ accountCreatedAt: context.user.created_at, subscriptionStatus: subscription?.status });
  return access.hasAccess ? { state: "allowed" as const, context, access } : { state: "expired" as const, context, access };
}
