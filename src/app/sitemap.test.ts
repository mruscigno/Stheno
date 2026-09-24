import { beforeEach, describe, expect, it, vi } from "vitest";
const select = vi.fn();
vi.mock("@/lib/config/env",()=>({publicEnv:{NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"test"}}));
vi.mock("@supabase/supabase-js",()=>({createClient:vi.fn(()=>({from:()=>({select})}))}));
import sitemap from "./sitemap";

describe("sitemap",()=>{
  beforeEach(()=>{const chain:{eq:(...args:unknown[])=>typeof chain;limit:(...args:unknown[])=>Promise<{data:never[]}>}={eq:()=>chain,limit:async()=>({data:[]})};select.mockReturnValue(chain)});
  it("contains only absolute canonical public URLs without duplicates",async()=>{
    const entries=await sitemap(),urls=entries.map(entry=>entry.url);
    expect(urls.every(url=>url==="https://www.sthenofitness.com"||url.startsWith("https://www.sthenofitness.com/"))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some(url=>url.includes("/app/"))).toBe(false);
    expect(urls).toContain("https://www.sthenofitness.com/author/matthew-david");
    expect(urls).toContain("https://www.sthenofitness.com/editorial-standards");
  });
  it("uses editorial modification dates for articles",async()=>{
    const entry=(await sitemap()).find(item=>item.url.endsWith("/insights/how-much-protein"));
    expect(entry?.lastModified).toEqual(new Date("2026-08-18"));
  });
});
