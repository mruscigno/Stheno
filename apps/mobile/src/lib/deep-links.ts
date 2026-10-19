export const allowedSchemes = new Set(["stheno", "stheno-dev", "https"]);
export const allowedHosts = new Set(["auth", "www.sthenofitness.com"]);

export type AuthCallback = { kind: "code"; code: string } | { kind: "otp"; tokenHash: string; type: "recovery" | "signup" | "email" } | { kind: "invalid" };

export function parseAuthCallback(rawUrl: string): AuthCallback {
  try {
    const url = new URL(rawUrl);
    if (!allowedSchemes.has(url.protocol.replace(":", "")) || !allowedHosts.has(url.host)) return { kind: "invalid" };
    const code = url.searchParams.get("code");
    if (code) return { kind: "code", code };
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    if (tokenHash && (type === "recovery" || type === "signup" || type === "email")) return { kind: "otp", tokenHash, type };
    return { kind: "invalid" };
  } catch { return { kind: "invalid" }; }
}
