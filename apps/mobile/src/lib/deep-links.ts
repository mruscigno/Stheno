export const allowedSchemes = new Set(["stheno", "stheno-dev", "https"]);
export const allowedHosts = new Set(["auth", "www.sthenofitness.com"]);

export type AuthCallback = { kind: "code"; code: string } | { kind: "otp"; tokenHash: string; type: "recovery" | "signup" | "email" } | { kind: "invalid" };

type AuthCallbackParams = { code?: string | string[]; token_hash?: string | string[]; type?: string | string[] };

export function parseAuthCallbackParams(params: AuthCallbackParams): AuthCallback {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const code = first(params.code);
  if (code) return { kind: "code", code };
  const tokenHash = first(params.token_hash);
  const type = first(params.type);
  if (tokenHash && (type === "recovery" || type === "signup" || type === "email")) return { kind: "otp", tokenHash, type };
  return { kind: "invalid" };
}

export function parseAuthCallback(rawUrl: string): AuthCallback {
  try {
    const url = new URL(rawUrl);
    if (!allowedSchemes.has(url.protocol.replace(":", "")) || !allowedHosts.has(url.host)) return { kind: "invalid" };
    return parseAuthCallbackParams({ code: url.searchParams.get("code") ?? undefined, token_hash: url.searchParams.get("token_hash") ?? undefined, type: url.searchParams.get("type") ?? undefined });
  } catch { return { kind: "invalid" }; }
}
