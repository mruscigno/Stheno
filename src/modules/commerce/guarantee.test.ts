import { describe, expect, it } from "vitest";
import { evaluateGuarantee, MONEY_BACK_GUARANTEE_DAYS } from "@/modules/commerce/guarantee";
describe("money-back guarantee", () => {
  it("includes the entire thirtieth day from the first paid charge", () => {
    const paidAt = new Date("2026-08-01T12:00:00.000Z");
    expect(evaluateGuarantee(paidAt, new Date("2026-08-31T12:00:00.000Z")).eligible).toBe(true);
  });
  it("expires after the deadline", () => {
    const paidAt = new Date("2026-08-01T12:00:00.000Z");
    expect(evaluateGuarantee(paidAt, new Date("2026-08-31T12:00:00.001Z")).eligible).toBe(false);
    expect(MONEY_BACK_GUARANTEE_DAYS).toBe(30);
  });
});
