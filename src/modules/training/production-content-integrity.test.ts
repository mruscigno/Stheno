import { describe,expect,it } from "vitest";
import manifest from "../../../content/exercise-media/vital-animations/provider-media-manifest.json";
import restored from "../../../content/exercises/restored-exercises.json";
import expansion from "../../../content/exercises/vital-provider-expansion.json";

const records=[...restored,...expansion] as Array<Record<string,unknown>>;
const slugs=records.map(x=>String(x.slug));
const validMuscles=new Set(["chest","back","shoulders","biceps","triceps","quadriceps","hamstrings","glutes","calves","core","forearms","hip_flexors","adductors","abductors","full_body","cardio","neck","upper legs"]);

describe("production content integrity",()=>{
  it("keeps stable unique exercise and provider-media identifiers",()=>{
    expect(new Set(slugs).size).toBe(slugs.length);
    const mediaSlugs=manifest.map(x=>x.sthenoId);
    expect(new Set(mediaSlugs).size).toBe(mediaSlugs.length);
    expect(manifest.every(x=>x.hostedVideoPath.includes(x.sthenoId)&&x.hostedPosterPath.includes(x.sthenoId))).toBe(true);
  });
  it("uses valid muscle taxonomy and complete reviewed education",()=>{
    for(const record of records){
      const muscles=(record.primaryMuscles??record.primary_muscles??[]) as string[];
      expect(muscles.length).toBeGreaterThan(0);
      expect(muscles.every(x=>validMuscles.has(x))).toBe(true);
      const education=record.education as Record<string,unknown>;
      expect(Array.isArray(education?.setup)&&education.setup.length>=2).toBe(true);
      expect(Array.isArray(education?.execution)&&education.execution.length>=2).toBe(true);
    }
  });
  it("does not create self or missing substitutions",()=>{
    const known=new Set(slugs);
    for(const record of records){
      const alternatives=(record.alternatives??[]) as Array<string|{slug:string}>;
      const values=alternatives.map(x=>typeof x==="string"?x:x.slug);
      expect(new Set(values).size).toBe(values.length);
      expect(values).not.toContain(record.slug);
      expect(values.every(x=>known.has(x))).toBe(true);
    }
  });
});
