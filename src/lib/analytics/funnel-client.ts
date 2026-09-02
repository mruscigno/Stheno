"use client";

import { capture } from "@/lib/analytics/client";
import type { EventName } from "@/modules/analytics/events";

export const ATTRIBUTION_STORAGE = "stheno_attribution_v1";
export type Attribution = {
  sessionId: string;
  first: Record<string, string>;
  last: Record<string, string>;
};

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

export function rememberAttribution(touch: Record<string, string>): Attribution {
  const current = readAttribution();
  const clean = Object.fromEntries(Object.entries(touch).filter(([, value]) => value));
  const attribution = { sessionId: current?.sessionId ?? newSessionId(), first: current?.first ?? clean, last: clean };
  localStorage.setItem(ATTRIBUTION_STORAGE, JSON.stringify(attribution));
  return attribution;
}

export async function captureFunnel(event: EventName, properties: Record<string, string | number | boolean | null> = {}) {
  const attribution = readAttribution();
  const merged = {
    ...attribution?.last,
    first_source: attribution?.first.source ?? "direct",
    first_campaign: attribution?.first.campaign ?? "",
    ...properties,
  };
  capture(event, merged);
  try {
    await fetch("/api/funnel/event", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, sessionId: attribution?.sessionId, properties: merged }),
    });
  } catch { /* Analytics must never block the funnel. */ }
}
