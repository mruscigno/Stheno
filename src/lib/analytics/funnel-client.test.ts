import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/analytics/client",()=>({capture:vi.fn()}));
import { ATTRIBUTION_STORAGE, captureFunnel, readAttribution, rememberAttribution } from "./funnel-client";

describe("acquisition attribution and delivery",()=>{
  beforeEach(()=>{localStorage.clear();sessionStorage.clear();history.replaceState({},"","/assessment");vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({accepted:true}),{status:200,headers:{"content-type":"application/json"}})));});

  it("creates and reuses a durable anonymous session for direct assessment traffic",async()=>{
    await captureFunnel("assessment_loaded",{assessment_version:"3.0.0"});
    const first=readAttribution();
    await captureFunnel("assessment_question_viewed",{question_number:1});
    expect(first?.sessionId).toBeTruthy();
    expect(readAttribution()?.sessionId).toBe(first?.sessionId);
    const bodies=(fetch as ReturnType<typeof vi.fn>).mock.calls.map(call=>JSON.parse(String(call[1]?.body)));
    expect(new Set(bodies.map(body=>body.sessionId)).size).toBe(1);
  });

  it("preserves first touch and updates last touch",()=>{
    const first=rememberAttribution({source:"instagram",campaign:"launch",landing_path:"/i"});
    const last=rememberAttribution({source:"direct",landing_path:"/assessment"});
    expect(last.sessionId).toBe(first.sessionId);
    expect(last.first.source).toBe("instagram");
    expect(last.last.source).toBe("direct");
    expect(JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE)!).firstSeenAt).toBeTruthy();
  });

  it("deduplicates once-only lifecycle events within a tab",async()=>{
    await captureFunnel("assessment_loaded",{}, {dedupeKey:"3.0.0"});
    const duplicate=await captureFunnel("assessment_loaded",{}, {dedupeKey:"3.0.0"});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(duplicate.status).toBe(208);
  });
});
