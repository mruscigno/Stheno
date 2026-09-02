"use client";
import { useEffect, useState } from "react";
import { captureFunnel, readAttribution } from "@/lib/analytics/funnel-client";

export function AttributionFields({ event }: { event?: "signup_start" | "checkout_view" }) {
  const [value, setValue] = useState("");
  useEffect(() => { const attribution = readAttribution(); setValue(attribution ? JSON.stringify(attribution) : ""); if(event)void captureFunnel(event); }, [event]);
  return <input type="hidden" name="attribution" value={value} />;
}
