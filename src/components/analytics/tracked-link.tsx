"use client";
import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import type { EventName } from "@/modules/analytics/events";
import { capture } from "@/lib/analytics/client";
type Props = ComponentProps<typeof Link> & {
  event: EventName;
  eventProperties?: Record<string, string | number | boolean>;
};
export function TrackedLink({
  event,
  eventProperties = {},
  onClick,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      onClick={(clickEvent) => {
        capture(event, eventProperties);
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
}: {
  event: EventName;
  eventProperties?: Record<string, string | number | boolean>;
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
  }, [event, serializedProperties]);
  return null;
}
