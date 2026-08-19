import { describe, expect, it } from "vitest";
import { csvFromRows, exportQueries } from "./export";
describe("account export", () => {
  it("escapes CSV values and preserves columns", () => { expect(csvFromRows([{ name: "Smith, Jane", note: 'said "yes"' }])).toBe('name,note\r\n"Smith, Jane","said ""yes"""'); });
  it("never selects billing provider identifiers", () => { expect(exportQueries.flatMap(([, , fields]) => fields.split(","))).not.toContain("stripe_customer_id"); });
});
