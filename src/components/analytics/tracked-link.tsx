"use client";
import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import { analytics } from "@heycatch/sdk";
import type { EventName } from "@/modules/analytics/events";
import { capture } from "@/lib/analytics/client";
type Props = ComponentProps<typeof Link> & {
  event: EventName;
  eventProperties?: Record<string, string | number | boolean>;
  heyCatchEvent?: EventName;
};
export function TrackedLink({
  event,
  eventProperties = {},
  heyCatchEvent,
  onClick,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      onClick={(clickEvent) => {
        capture(event, eventProperties);
        if (heyCatchEvent) analytics.trackEvent(heyCatchEvent, eventProperties);
        onClick?.(clickEvent);
      }}
    />
  );
}
export function TrackedButton({
  event,
  eventProperties = {},
  onClick,
  ...props
}: ComponentProps<"button"> & {
  event: EventName;
  eventProperties?: Record<string, string | number | boolean>;
}) {
  return (
    <button
      {...props}
      onClick={(clickEvent) => {
        capture(event, eventProperties);
        onClick?.(clickEvent);
      }}
    />
  );
}
export function TrackView({
  event,
  eventProperties,
  heyCatchEvent,
}: {
  event: EventName;
  eventProperties?: Record<string, string | number | boolean>;
  heyCatchEvent?: EventName;
}) {
  const serializedProperties = JSON.stringify(eventProperties ?? {});
  useEffect(() => {
    capture(
      event,
      JSON.parse(serializedProperties) as Record<
        string,
        string | number | boolean
      >,
    );
    if (heyCatchEvent) analytics.trackEvent(heyCatchEvent, JSON.parse(serializedProperties));
  }, [event, heyCatchEvent, serializedProperties]);
  return null;
}
