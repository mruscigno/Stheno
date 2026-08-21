import { describe, expect, it } from "vitest";
import { articleCaption, countHashtags } from "./captions";
import { socialPlatforms, socialTemplates } from "./config";

const article={slug:"how-fat-loss-works",title:"How Fat Loss Actually Works",thesis:"Fat loss requires an energy deficit over time.",pillar:"fat-loss"};

describe("Product 18 social studio domain",()=>{
  it("defines exactly five locked STHENO templates",()=>{
    expect(socialTemplates.map(item=>item.id)).toEqual(["editorial-hero","bold-headline","key-takeaway","fitness-split","story-cover"]);
  });
  it("centralizes every required export dimension",()=>{
    expect(socialPlatforms.instagram_post).toMatchObject({width:1080,height:1350});
    expect(socialPlatforms.instagram_story).toMatchObject({width:1080,height:1920});
    expect(socialPlatforms.x).toMatchObject({width:1600,height:900});
    expect(socialPlatforms.linkedin).toMatchObject({width:1200,height:627});
    expect(socialPlatforms.facebook).toMatchObject({width:1200,height:627});
    expect(socialPlatforms.square).toMatchObject({width:1080,height:1080});
  });
  it("generates exactly three relevant Instagram hashtags",()=>{
    const caption=articleCaption(article,"instagram_post");
    expect(countHashtags(caption)).toBe(3);
    expect(caption).not.toMatch(/fast-paced world|seasoned athlete/i);
  });
  it("includes the canonical article URL in link-oriented captions",()=>{
    for(const platform of ["x","linkedin","facebook"] as const)expect(articleCaption(article,platform)).toContain("https://www.sthenofitness.com/insights/how-fat-loss-works");
  });
});
