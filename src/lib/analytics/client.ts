"use client";

import posthog from "posthog-js";
import type { EventName } from "@/modules/analytics/events";
import { safeAnalyticsProperties, type AnalyticsProperties } from "@/modules/analytics/privacy";

export function capture(event: EventName, properties: AnalyticsProperties = {}) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, safeAnalyticsProperties(properties));
}

export function identifyAnalyticsUser(userId: string, properties: AnalyticsProperties = {}) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(userId, safeAnalyticsProperties(properties));
}

export function resetAnalyticsIdentity() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.reset();
}
