"use client";
import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import type { EventName } from "@/modules/analytics/events";
type Props = ComponentProps<typeof Link> & { event: EventName; eventProperties?: Record<string, string | number | boolean> };
export function TrackedLink({ event, eventProperties = {}, onClick, ...props }: Props) { return <Link {...props} onClick={(clickEvent) => { const posthog = (window as Window & { posthog?: { capture: (name: string, properties?: object) => void } }).posthog; posthog?.capture(event, eventProperties); onClick?.(clickEvent); }} />; }
export function TrackedButton({ event, eventProperties = {}, onClick, ...props }: ComponentProps<"button"> & { event: EventName; eventProperties?: Record<string, string | number | boolean> }) { return <button {...props} onClick={(clickEvent) => { const posthog = (window as Window & { posthog?: { capture: (name: string, properties?: object) => void } }).posthog; posthog?.capture(event, eventProperties); onClick?.(clickEvent); }} />; }
export function TrackView({ event }: { event: EventName }) { useEffect(() => { (window as Window & { posthog?: { capture: (name: string) => void } }).posthog?.capture(event); }, [event]); return null; }
