import {describe,expect,it} from "vitest";
import {canonicalJson,retryDelayMs,shouldPreserveAsConflict} from "./workout-sync-policy";

describe("workout durable outbox policy",()=>{
  it("hashes semantically identical payloads identically",()=>{expect(canonicalJson({b:2,a:{d:4,c:3}})).toBe(canonicalJson({a:{c:3,d:4},b:2}));});
  it("backs off and caps retries",()=>{expect(retryDelayMs(1)).toBe(2_000);expect(retryDelayMs(20)).toBe(300_000);});
  it("preserves revision conflicts for explicit reconciliation",()=>{expect(shouldPreserveAsConflict(409)).toBe(true);expect(shouldPreserveAsConflict(503)).toBe(false);});
});
