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
const deploymentTimestamp = process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? new Date().toISOString();

export async function POST(request: Request) {
  const parsed = EventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const server = await createSupabaseServerClient();
  const { data: { user } } = server ? await server.auth.getUser() : { data: { user: null } };
  const properties = safeAnalyticsProperties(parsed.data.properties);
  const userAgent = request.headers.get("user-agent") ?? "";
  const inferredBrowser = /CriOS/i.test(userAgent) ? "chrome-ios" : /FxiOS/i.test(userAgent) ? "firefox-ios" : /Edg/i.test(userAgent) ? "edge" : /Chrome/i.test(userAgent) ? "chrome" : /Safari/i.test(userAgent) ? "safari" : "other";
  const inferredDevice = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";
  const botSignal = /bot|crawler|spider|headless|preview|facebookexternalhit|Slackbot/i.test(userAgent);
  const appVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version ?? "local";
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
    device: String(properties.device ?? inferredDevice).slice(0, 40),
    browser: String(properties.browser ?? inferredBrowser).slice(0, 40),
    route: String(properties.route ?? "").slice(0, 160) || null,
    app_version: appVersion.slice(0, 80),
    deployment_timestamp: deploymentTimestamp,
    bot_signal: botSignal,
    properties: { ...properties, app_version: appVersion, bot_signal: botSignal },
  });
  if (error) {
    console.error("funnel_event_insert_failed", { event: parsed.data.event, code: error.code });
    return NextResponse.json({ accepted: false, error: "Event delivery failed" }, { status: 202 });
  }
  return NextResponse.json({ accepted: true });
}
