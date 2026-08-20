export type AnalyticsProperties = Record<string, string | number | boolean | null>;

const sensitiveKey = /(answer|free.?text|medical|diagnos|injur|message|note|context|symptom)/i;

/** Prevent accidental collection of assessment answers or health-related free text. */
export function safeAnalyticsProperties(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (sensitiveKey.test(key)) return false;
      return typeof value !== "string" || value.length <= 120;
    }),
  );
}
