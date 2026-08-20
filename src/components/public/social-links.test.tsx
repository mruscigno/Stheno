import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SocialLinks } from "./social-links";

describe("SocialLinks", () => {
  it("links every official STHENO social account accessibly and safely", () => {
    const html = renderToStaticMarkup(<SocialLinks />);
    for (const platform of ["Instagram", "X", "TikTok", "Reddit", "YouTube"]) {
      expect(html).toContain(`aria-label="STHENO Fitness on ${platform}"`);
    }
    expect(html.match(/target="_blank"/g)).toHaveLength(5);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(5);
    expect(html).toContain("instagram.com/sthenofitness8/");
    expect(html).toContain("x.com/SthenoFitness8");
    expect(html).toContain("reddit.com/user/SthenoFitness/");
    expect(html).toContain("tiktok.com/@sthenofitness?lang=en");
    expect(html).toContain("youtube.com/channel/UC737ojNjs_dTf-mc6ytZvtw");
  });
});
