import { describe, expect, it, vi } from "vitest";
import { createSthenoApiClient, SthenoApiError } from "./api-client";

describe("typed STHENO API client foundation", () => {
  it("sends the Supabase bearer token without embedding a privileged key", async () => {
    let observedInit: RequestInit | undefined;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      observedInit = init;
      return new Response(JSON.stringify({ apiVersion: "1.0", requestId: "request-123", data: { id: "member" } }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = createSthenoApiClient({ baseUrl: "https://www.sthenofitness.com", getAccessToken: async () => "member-token", fetchImplementation: fetcher as typeof fetch });
    await client.me();
    expect(fetcher).toHaveBeenCalledOnce();
    expect(new Headers(observedInit?.headers).get("authorization")).toBe("Bearer member-token");
  });

  it("raises structured API failures", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ apiVersion: "1.0", requestId: "request-123", error: { code: "AUTH_REQUIRED", message: "Authentication is required." } }), { status: 401, headers: { "content-type": "application/json" } }));
    const client = createSthenoApiClient({ baseUrl: "https://www.sthenofitness.com", getAccessToken: async () => null, fetchImplementation: fetcher as typeof fetch });
    await expect(client.me()).rejects.toBeInstanceOf(SthenoApiError);
  });
});
