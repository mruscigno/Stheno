import "server-only";

type AcceptanceState = { responseLossUsers: Set<string> };

const stateKey = Symbol.for("stheno.native-acceptance-controls");

function state() {
  const root = globalThis as typeof globalThis & Record<symbol, AcceptanceState | undefined>;
  root[stateKey] ??= { responseLossUsers: new Set<string>() };
  return root[stateKey];
}

export function nativeAcceptanceControlsEnabled() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isolatedLocalBackend = supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost");
  return process.env.TEST_ENVIRONMENT === "true" && process.env.NODE_ENV !== "production" && isolatedLocalBackend;
}

export function armResponseLoss(userId: string) {
  if (!nativeAcceptanceControlsEnabled()) throw new Error("NATIVE_ACCEPTANCE_CONTROLS_DISABLED");
  state().responseLossUsers.add(userId);
}

export function consumeResponseLoss(userId: string) {
  if (!nativeAcceptanceControlsEnabled()) return false;
  const armed = state().responseLossUsers.delete(userId);
  return armed;
}
