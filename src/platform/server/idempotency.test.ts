import { describe, expect, it } from "vitest";
import { payloadHash } from "./payload-hash";

describe("API idempotency payload hashing", () => {
  it("is stable across object key ordering", () => {
    expect(payloadHash({ operationId: "one", payload: { reps: 8, load: 50 } })).toBe(payloadHash({ payload: { load: 50, reps: 8 }, operationId: "one" }));
  });

  it("changes when the operation payload changes", () => {
    expect(payloadHash({ reps: 8, load: 50 })).not.toBe(payloadHash({ reps: 9, load: 50 }));
  });
});
