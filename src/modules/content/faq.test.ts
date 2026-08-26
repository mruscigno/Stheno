import { describe, expect, it } from "vitest";
import { homepageFaqItems, faqItems } from "./faq";
import { membership } from "@/modules/commerce/product";

describe("public FAQ content", () => {
  it("uses unique questions and includes the free-app objection on the homepage", () => { expect(new Set(faqItems.map((item) => item.id)).size).toBe(faqItems.length); expect(homepageFaqItems).toHaveLength(9); expect(homepageFaqItems.some((item) => item.id === "free-apps")).toBe(true); });
  it("derives membership pricing from the canonical product source", () => { const pricing = faqItems.find((item) => item.id === "price")?.answer; expect(pricing).toContain(membership.monthly.label); expect(pricing).toContain(membership.annual.label); });
  it("describes the export without promising billing secrets", () => { const copy = faqItems.find((item) => item.id === "export")?.answer ?? ""; expect(copy).toMatch(/assessment.*plan.*workout.*nutrition.*activity.*progress/i); expect(copy).not.toMatch(/stripe|payment method|card number/i); });
});
