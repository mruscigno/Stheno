import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventNames } from "@/modules/analytics/events";
import { safeAnalyticsProperties } from "@/modules/analytics/privacy";

const EventSchema = z.object({
  event: z.enum(eventNames),
  sessionId: z.string().max(100).optional(),
  properties: z.record(z.string(), z.union([z.string().max(120), z.number(), z.boolean(), z.null()])).default({}),
});

export async function POST(request: Request) {
  const parsed = EventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const server = await createSupabaseServerClient();
  const { data: { user } } = server ? await server.auth.getUser() : { data: { user: null } };
  const properties = safeAnalyticsProperties(parsed.data.properties);
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ accepted: true }, { status: 202 });
  const { error } = await admin.from("social_funnel_events").insert({
    event_name: parsed.data.event,
    anonymous_session_id: parsed.data.sessionId ?? null,
    user_id: user?.id ?? null,
    source: String(properties.source ?? properties.utm_source ?? "direct").slice(0, 80),
    medium: String(properties.medium ?? properties.utm_medium ?? "").slice(0, 80) || null,
    campaign: String(properties.campaign ?? properties.utm_campaign ?? "").slice(0, 120) || null,
    content: String(properties.content ?? properties.utm_content ?? "").slice(0, 120) || null,
    landing_variant: String(properties.variant ?? "default").slice(0, 80),
    device: String(properties.device ?? "unknown").slice(0, 40),
    browser: String(properties.browser ?? "unknown").slice(0, 40),
    properties,
  });
  return error ? NextResponse.json({ accepted: false }, { status: 202 }) : NextResponse.json({ accepted: true });
}
