import { describe, expect, it } from "vitest";
import { socialRedirects } from "./short-routes";

describe("social short routes",()=>{
  it("maps every supported platform to the tracked landing page",()=>{
    const expected={f:"facebook",i:"instagram",l:"linkedin",r:"reddit",t:"tiktok",x:"x",y:"youtube"};
    for(const [short,source] of Object.entries(expected)){
      expect(socialRedirects).toContainEqual(expect.objectContaining({source:`/${short}`,destination:`/start?source=${source}&entry=/${short}`,permanent:false}));
    }
  });
});
