"use client";

import { capture } from "@/lib/analytics/client";
import type { EventName } from "@/modules/analytics/events";

export const ATTRIBUTION_STORAGE = "stheno_attribution_v1";
export type Attribution = {
  sessionId: string;
  first: Record<string, string>;
  last: Record<string, string>;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type FunnelDelivery = { accepted: boolean; status: number; event: EventName; error?: string };

function newSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE) || "null") as Attribution | null; }
  catch { return null; }
}

function ensureAttribution(): Attribution {
  const current = readAttribution();
  if (current) return current;
  return rememberAttribution({ source: "direct", landing_path: window.location.pathname });
}

export function rememberAttribution(touch: Record<string, string>): Attribution {
  const current = readAttribution();
  const clean = Object.fromEntries(Object.entries(touch).filter(([, value]) => value));
  const now = new Date().toISOString();
  const attribution = { sessionId: current?.sessionId ?? newSessionId(), first: current?.first ?? clean, last: clean, firstSeenAt: current?.firstSeenAt ?? now, lastSeenAt: now };
  try { localStorage.setItem(ATTRIBUTION_STORAGE, JSON.stringify(attribution)); } catch { /* Analytics storage must never block the funnel. */ }
  return attribution;
}

export async function captureFunnel(event: EventName, properties: Record<string, string | number | boolean | null> = {}, options: { dedupeKey?: string } = {}): Promise<FunnelDelivery> {
  const attribution = ensureAttribution();
  const dedupeKey = options.dedupeKey ? `stheno_funnel:${event}:${options.dedupeKey}` : "";
  if (dedupeKey) {
    try { if (sessionStorage.getItem(dedupeKey)) return { accepted: true, status: 208, event }; } catch { /* continue */ }
  }
  const merged = {
    ...attribution?.last,
    first_source: attribution?.first.source ?? "direct",
    first_campaign: attribution?.first.campaign ?? "",
    first_landing_path: attribution?.first.landing_path ?? attribution?.first.first_landing_path ?? "",
    first_seen_at: attribution?.firstSeenAt ?? "",
    last_seen_at: attribution?.lastSeenAt ?? "",
    route: typeof window === "undefined" ? "" : window.location.pathname,
    ...properties,
  };
  capture(event, merged);
  try {
    const response = await fetch("/api/funnel/event", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, sessionId: attribution?.sessionId, properties: merged }),
    });
    const payload = await response.json().catch(() => ({})) as { accepted?: boolean; error?: string };
    const delivery = { accepted: response.ok && payload.accepted !== false, status: response.status, event, error: payload.error };
    if (delivery.accepted && dedupeKey) try { sessionStorage.setItem(dedupeKey, "1"); } catch { /* continue */ }
    window.dispatchEvent(new CustomEvent("stheno:analytics-debug", { detail: { ...delivery, properties: merged, at: new Date().toISOString() } }));
    return delivery;
  } catch (cause) {
    const delivery = { accepted: false, status: 0, event, error: cause instanceof Error ? cause.message : "Network error" };
    window.dispatchEvent(new CustomEvent("stheno:analytics-debug", { detail: { ...delivery, properties: merged, at: new Date().toISOString() } }));
    return delivery;
  }
}
