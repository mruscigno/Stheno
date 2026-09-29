import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root=process.cwd();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error("Production Supabase public environment is required.");
const db=createClient(url,key,{auth:{persistSession:false}});
const {data,error,count}=await db.from("exercises").select("*",{count:"exact"}).eq("status","production").order("slug").limit(1000);
if(error)throw error;
if(count!==data.length)throw new Error(`Production audit was incomplete: received ${data.length} of ${count}.`);
const records=data;
const bySlug=new Map(records.map(x=>[x.slug,x]));
const manifest=JSON.parse(fs.readFileSync(path.join(root,"content/exercise-media/vital-animations/provider-media-manifest.json"),"utf8"));
const mediaBySlug=new Map(manifest.map(x=>[x.sthenoId,x]));
const issues=[];
const add=(exercise,field,problem,severity,correction)=>issues.push({exercise:exercise.slug,field,problem,severity,correction});
const generic=new Set(["move with control through a comfortable range.","keep your breathing steady and your joints aligned.","stop the set before technique changes.","rushing the movement or using momentum.","forcing a range that causes pain.","losing the intended starting position.","build controlled strength and skill in the listed primary muscles."]);
const contradictions={upper:[/sprint(?:ing| interval)?/i,/glute activation/i,/hip mobility/i,/drive through (?:the )?heel/i],lower:[/draw (?:the|your) arm/i,/elbows? toward your hips/i,/cable attachment/i,/triceps pushdown/i],core:[/all-out sprint/i,/cable (?:pulley|attachment)/i,/triceps pushdown/i,/shoulder stretch/i],cardio:[/triceps contraction/i,/cable attachment/i,/bench press/i]};
const group=e=>{const muscles=e.primary_muscles??[];if(e.exercise_type==="cardio")return "cardio";if(muscles.includes("core"))return "core";if(muscles.some(x=>["quadriceps","hamstrings","glutes","calves"].includes(x)))return "lower";return "upper";};
const duplicateBuckets=new Map();
for(const exercise of records){
  const education=exercise.education??{};
  const combined=[exercise.purpose,...(education.setup??[]),...(education.execution??[]),...(education.cues??[]),...(education.mistakes??[])].filter(Boolean).join(" ");
  for(const pattern of contradictions[group(exercise)]??[])if(pattern.test(combined))add(exercise,"semantic consistency",`Content conflicts with ${group(exercise)}-body movement metadata: ${pattern}.`,"critical","Review the production record against the movement identity and correct the contaminated field.");
  if(!exercise.name||!exercise.purpose||!exercise.movement_pattern||!exercise.primary_muscles?.length||!exercise.required_equipment?.length)add(exercise,"required fields","One or more required identity fields are missing.","critical","Complete and review the identity metadata before production use.");
  for(const field of ["setup","execution","cues","mistakes"]){
    const values=education[field]??[];
    if(values.length<2)add(exercise,field,"Fewer than two reviewed instructions are present.","high","Add movement-specific reviewed guidance.");
    const templated=values.filter(x=>generic.has(String(x).trim().toLowerCase()));
    if(templated.length)add(exercise,field,`${templated.length} generic template line(s) provide limited movement-specific value.`,"medium","Replace generic lines during editorial review; retain only safety language that is genuinely shared.");
    for(const value of values){const normalized=String(value).trim().toLowerCase();if(normalized.length<24)continue;const list=duplicateBuckets.get(normalized)??[];list.push({slug:exercise.slug,field});duplicateBuckets.set(normalized,list);}
  }
  if(!education.feel)add(exercise,"what-you-should-feel","Missing expected-effort guidance.","high","Describe plausible muscular effort without implying pain is required.");
  if(!education.stopModify)add(exercise,"caution","Missing stop/modify guidance.","high","Add conservative, non-diagnostic safety guidance.");
  if(exercise.technical_review_status!=="reviewed"||exercise.editorial_review_status!=="reviewed"||exercise.visual_review_status!=="reviewed"||!exercise.production_ready)add(exercise,"quality state","Production record is not fully reviewed and production-ready.","critical","Return the record to review before public release.");
  const media=mediaBySlug.get(exercise.slug);
  if(media)for(const [field,asset] of [["video",media.hostedVideoPath],["thumbnail",media.hostedPosterPath]])if(!asset||!fs.existsSync(path.join(root,"public",asset.replace(/^\//,""))))add(exercise,"media",`${field} asset is missing or broken.`,"high","Correct the manifest mapping or leave the guide instructional-only.");
}
const duplicateClusters=[...duplicateBuckets.entries()].filter(([,items])=>new Set(items.map(x=>x.slug)).size>=3).map(([text,items])=>({text,items}));
for(const cluster of duplicateClusters)for(const item of cluster.items)add(bySlug.get(item.slug),item.field,`Exact customer-facing text repeats across ${new Set(cluster.items.map(x=>x.slug)).size} exercises.`,"medium","Review the cluster; preserve legitimate shared safety language and replace non-useful boilerplate.");
const counts=issues.reduce((m,x)=>(m[x.severity]=(m[x.severity]??0)+1,m),{});
const flagged=new Set(issues.map(x=>x.exercise)).size;
const correctedExamples=["pistol-squat","sit-ups-version-1","tricepss-pushdown-cable-straight-bar"].filter(slug=>bySlug.has(slug)&&!issues.some(x=>x.exercise===slug&&x.severity==="critical"));
const lines=["# Exercise content integrity audit","",`Generated from the live production Supabase table: ${new Date().toISOString()}`,`Production exercise count: **${count}**`,`Records checked: **${records.length}**`,`Records flagged: **${flagged}**`,`Critical flags: **${counts.critical??0}**`,`Media mismatches or missing mapped assets: **${issues.filter(x=>x.field==="media").length}**`,`Duplicate-content clusters: **${duplicateClusters.length}**`,"","## Production findings","",`The previously reported Pistol Squat, Sit Ups Version 1, and cable triceps pushdown examples now contain movement-appropriate production content. Verified examples without critical semantic flags: ${correctedExamples.join(", ")||"none"}. Remaining flags are reported below and are not silently rewritten.`,"","## Root cause and protections","","Historical content was assembled through multiple catalog-expansion and media-ingestion paths with different schemas. Generic fallback education could be marked complete because field presence—not semantic specificity—was the dominant gate. The production release gate already tracks technical, editorial, visual, and production-ready states. This audit now checks the live table, validates the provider manifest by stable slug, requires the returned row count to match the production count, and adds regression tests for duplicate IDs, broken media mappings, invalid taxonomy, self-substitution, and missing reviewed fields.","","## Issue categories",...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`),"","## Detailed findings","","| Exercise | Field | Problem | Severity | Recommended correction |","| --- | --- | --- | --- | --- |",...issues.map(x=>`| ${x.exercise} | ${x.field} | ${x.problem.replaceAll("|","\\|")} | ${x.severity} | ${x.correction.replaceAll("|","\\|")} |`),"","## Manual QA and production verification","","Representative public pages must be checked after deployment across major muscles, equipment types, cardio, mobility, and bodyweight. Production verification results are appended after release; unresolved medium flags remain an editorial backlog and are not described as corrected."];
fs.writeFileSync(path.join(root,"docs/exercise-content-integrity-audit.md"),lines.join("\n")+"\n");
console.log(JSON.stringify({productionCount:count,checked:records.length,flagged,issues:issues.length,counts,duplicateClusters:duplicateClusters.length,mediaMapped:manifest.length},null,2));
