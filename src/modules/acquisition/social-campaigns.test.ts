import { describe, expect, it } from "vitest";

import {
  approvedCampaign,
  approvedSource,
  socialCampaigns,
} from "@/modules/acquisition/social-campaigns";

describe("social acquisition campaign allowlists", () => {
  it("accepts known social sources and rejects arbitrary values", () => {
    expect(approvedSource("tiktok")).toBe("tiktok");
    expect(approvedSource("<script>alert(1)</script>")).toBeNull();
  });

  it("returns copy only for approved campaign variants", () => {
    const campaign = approvedCampaign("three-days");
    expect(campaign).toBe("three-days");
    expect(campaign && socialCampaigns[campaign].headline).toBeTruthy();
    expect(approvedCampaign("invented-copy")).toBeNull();
  });
});
