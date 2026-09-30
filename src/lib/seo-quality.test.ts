import { describe, expect, it } from "vitest";
import { articleOpening, articles } from "@/modules/library/articles";
import { tools } from "@/modules/library/tools";
import {
  articleMetaDescription,
  articlePageTitle,
  exerciseMetaDescription,
  exercisePageTitle,
  organizationJsonLd,
  toolMetaDescription,
} from "./seo";

describe("SEO quality gates", () => {
  it("gives every article a direct 40–60 word opening", () => {
    for (const article of articles) {
      const opening = articleOpening(article);
      const words = opening.match(/\S+/g)?.length ?? 0;
      expect(words, article.slug).toBeGreaterThanOrEqual(40);
      expect(words, article.slug).toBeLessThanOrEqual(60);
      expect(opening, article.slug).not.toMatch(/^(this|they|it)\b/i);
    }
  });

  it("keeps article titles and descriptions inside search-result ranges", () => {
    for (const article of articles) {
      const title = articlePageTitle(article.title);
      const description = articleMetaDescription(article.description);
      expect(title.length, article.slug).toBeGreaterThanOrEqual(30);
      expect(title.length, article.slug).toBeLessThanOrEqual(60);
      expect(description.length, article.slug).toBeGreaterThanOrEqual(110);
      expect(description.length, article.slug).toBeLessThanOrEqual(160);
    }
  });

  it("keeps tool descriptions inside the recommended range", () => {
    for (const tool of tools) {
      const description = toolMetaDescription(tool.summary, tool.title);
      expect(description.length, tool.slug).toBeGreaterThanOrEqual(110);
      expect(description.length, tool.slug).toBeLessThanOrEqual(160);
    }
  });

  it("creates useful exercise metadata for short and long names", () => {
    for (const name of ["Dip", "Dumbbell Romanian Deadlift", "Cable Triceps Pushdown (V-Bar Attachment)","Triceps Cable Pushdown (Straight Bar Attachment)"]) {
      expect(exercisePageTitle(name).length).toBeGreaterThanOrEqual(30);
      expect(exercisePageTitle(name).length).toBeLessThanOrEqual(60);
      expect(exerciseMetaDescription(name).length).toBeGreaterThanOrEqual(110);
      expect(exerciseMetaDescription(name).length).toBeLessThanOrEqual(160);
    }
  });

  it("publishes organization profiles in structured data", () => {
    expect(organizationJsonLd().sameAs).toHaveLength(5);
  });
});
