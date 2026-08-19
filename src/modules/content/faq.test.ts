import { describe, expect, it } from "vitest";
import { homepageFaqItems, faqItems } from "./faq";
import { membership } from "@/modules/commerce/product";

describe("public FAQ content", () => {
  it("uses unique questions and provides eight homepage answers", () => { expect(new Set(faqItems.map((item) => item.id)).size).toBe(faqItems.length); expect(homepageFaqItems).toHaveLength(8); });
  it("derives membership pricing from the canonical product source", () => { const pricing = faqItems.find((item) => item.id === "price")?.answer; expect(pricing).toContain(membership.monthly.label); expect(pricing).toContain(membership.annual.label); });
  it("describes the export without promising billing secrets", () => { const copy = faqItems.find((item) => item.id === "export")?.answer ?? ""; expect(copy).toMatch(/assessment.*plan.*workout.*nutrition.*activity.*progress/i); expect(copy).not.toMatch(/stripe|payment method|card number/i); });
});
