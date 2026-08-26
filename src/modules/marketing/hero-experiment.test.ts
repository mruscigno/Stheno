import { afterEach, describe, expect, it } from "vitest";
import { activeHomepageHeroVariant, homepageHeroVariants } from "@/modules/marketing/hero-experiment";
describe("homepage positioning experiment", () => {
  afterEach(() => { delete process.env.NEXT_PUBLIC_HOMEPAGE_HERO_VARIANT; });
  it("uses the structure positioning by default", () => {
    expect(activeHomepageHeroVariant()).toBe("structure");
    expect(homepageHeroVariants.structure).toContain("without a personal trainer");
  });
  it("allows the approved budget variant only", () => {
    process.env.NEXT_PUBLIC_HOMEPAGE_HERO_VARIANT = "budget";
    expect(activeHomepageHeroVariant()).toBe("budget");
    process.env.NEXT_PUBLIC_HOMEPAGE_HERO_VARIANT = "unknown";
    expect(activeHomepageHeroVariant()).toBe("structure");
  });
});
