import { describe, expect, it } from "vitest";
import { parseAuthCallback } from "./deep-links";

describe("auth callback allowlist", () => {
  it("accepts an app PKCE callback", () => expect(parseAuthCallback("stheno-dev://auth/callback?code=one-time-code")).toEqual({ kind: "code", code: "one-time-code" }));
  it("accepts an allowlisted recovery OTP", () => expect(parseAuthCallback("https://www.sthenofitness.com/auth/mobile?token_hash=hash&type=recovery")).toEqual({ kind: "otp", tokenHash: "hash", type: "recovery" }));
  it("rejects untrusted hosts and malformed links", () => {
    expect(parseAuthCallback("https://attacker.example/auth/mobile?code=secret")).toEqual({ kind: "invalid" });
    expect(parseAuthCallback("not a URL")).toEqual({ kind: "invalid" });
  });
});
