import type { EventName } from "@/modules/analytics/events";
import { safeAnalyticsProperties, type AnalyticsProperties } from "@/modules/analytics/privacy";

export async function captureServerEvent(event: EventName, distinctId: string, properties: AnalyticsProperties = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
  await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, event, properties: { distinct_id: distinctId, ...safeAnalyticsProperties(properties) } }),
  });
}
