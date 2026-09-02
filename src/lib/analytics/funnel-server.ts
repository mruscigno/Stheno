import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EventName } from "@/modules/analytics/events";
import { safeAnalyticsProperties, type AnalyticsProperties } from "@/modules/analytics/privacy";

type Attribution = { sessionId?: string; first?: Record<string, string>; last?: Record<string, string> };

export function parseAttribution(value: FormDataEntryValue | null): Attribution | null {
  if (typeof value !== "string" || value.length > 3000) return null;
  try { const parsed = JSON.parse(value) as Attribution; return parsed && typeof parsed === "object" ? parsed : null; }
  catch { return null; }
}

export async function captureFunnelServer(event: EventName, userId: string | null, properties: AnalyticsProperties = {}, attribution: Attribution | null = null) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  const safe = safeAnalyticsProperties(properties);
  const touch = attribution?.last ?? attribution?.first ?? {};
  await admin.from("social_funnel_events").insert({
    event_name: event,
    anonymous_session_id: attribution?.sessionId ?? null,
    user_id: userId,
    source: touch.source ?? touch.utm_source ?? String(safe.source ?? "direct"),
    medium: (touch.medium ?? touch.utm_medium ?? String(safe.medium ?? "")) || null,
    campaign: (touch.campaign ?? touch.utm_campaign ?? String(safe.campaign ?? "")) || null,
    content: (touch.content ?? touch.utm_content ?? String(safe.content ?? "")) || null,
    landing_variant: touch.variant ?? String(safe.variant ?? "default"),
    device: String(safe.device ?? "unknown"), browser: String(safe.browser ?? "unknown"), properties: safe,
  });
}
