import { describe, expect, it, vi } from "vitest";
import { installAnalyticsTransport, track } from "./analytics";

describe("privacy-safe mobile analytics", () => {
  it("delivers only the constrained event shape", () => { const transport = vi.fn(); installAnalyticsTransport(transport); track("auth_login_failure", { category: "invalid_credentials", route: "/sign-in" }); expect(transport).toHaveBeenCalledWith("auth_login_failure", { category: "invalid_credentials", route: "/sign-in" }); });
});
