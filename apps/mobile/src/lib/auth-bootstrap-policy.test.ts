import { describe, expect, it } from "vitest";
import { SthenoApiError } from "@shared/client/api-client";
import { canUseLocalMemberData, classifyAuthenticatedBootstrap } from "./auth-bootstrap-policy";

describe("offline authenticated bootstrap policy", () => {
  it("permits only local member data when a persisted session starts without network", () => {
    expect(classifyAuthenticatedBootstrap(undefined, false)).toBe("authenticatedOffline");
    expect(canUseLocalMemberData("authenticatedOffline")).toBe(true);
  });
  it("never turns an explicit online authentication rejection into offline access", () => {
    const rejected = new SthenoApiError(401, { apiVersion: "1.0", requestId: "test", error: { code: "AUTH_REQUIRED", message: "expired" } });
    expect(classifyAuthenticatedBootstrap(rejected, true)).toBe("reauthRequired");
    expect(canUseLocalMemberData("reauthRequired")).toBe(false);
  });
  it("does not hide authorization or server failures as offline", () => {
    const forbidden = new SthenoApiError(403, { apiVersion: "1.0", requestId: "test", error: { code: "AUTH_REQUIRED", message: "forbidden" } });
    expect(classifyAuthenticatedBootstrap(forbidden, true)).toBe("error");
    expect(classifyAuthenticatedBootstrap(new Error("server failed"), true)).toBe("error");
  });
});
