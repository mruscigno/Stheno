type DiagnosticValue = string | number | boolean | null;

const enabled = __DEV__ || process.env.EXPO_PUBLIC_NATIVE_JOURNEY_DIAGNOSTICS === "true";
const correlationId = `native-${Date.now().toString(36)}`;

export function journeyDiagnostic(event: string, details: Record<string, DiagnosticValue> = {}) {
  if (!enabled) return;
  console.info(JSON.stringify({ scope: "stheno_native_journey", correlationId, event, ...details }));
}
