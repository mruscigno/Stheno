import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseCsv(text) {
  const rows=[]; let row=[],value="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(value);value="";}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);value="";if(row.some(Boolean))rows.push(row);row=[];}else value+=c;}
  if(value||row.length){row.push(value);rows.push(row);}const [headers,...data]=rows;return data.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??""])));
}
function csv(rows,columns){const e=v=>`"${String(v??"").replaceAll('"','""')}"`;return `${columns.map(e).join(",")}\n${rows.map(r=>columns.map(c=>e(r[c])).join(",")).join("\n")}\n`;}
const root=process.cwd(),docs=path.join(root,"docs/mobile/app6d2a");
const master=parseCsv(await readFile(path.join(docs,"ASSET_DISPOSITION_MASTER.csv"),"utf8"));
const review=parseCsv(await readFile(path.join(docs,"BATCH_2_QUALITY_AND_SAFETY_REVIEW.csv"),"utf8"));
const decision=new Map(review.map(r=>[r.asset_id,r]));
for(const row of master){const reviewed=decision.get(row.asset_id);if(!reviewed)continue;row.disposition=reviewed.visual_mapping_review==="rejected"?"rejected_visual_review":reviewed.media_role==="technique_tip"?"accepted_supplemental_candidate":"accepted_existing_exercise_candidate";row.disposition_reason=reviewed.review_note;}
const columns=Object.keys(master[0]);
await writeFile(path.join(docs,"ASSET_DISPOSITION_MASTER.csv"),csv(master,columns));
await writeFile(path.join(docs,"NEXT_UNREVIEWED_QUEUE.csv"),csv(master.filter(r=>r.disposition.startsWith("pending_")),columns));
const firstManifest=parseCsv(await readFile(path.join(root,"docs/mobile/app6d2/SOURCE_AND_DERIVATIVE_MANIFEST.csv"),"utf8"));
const secondManifest=parseCsv(await readFile(path.join(docs,"BATCH_2_SOURCE_DERIVATIVE_MANIFEST.csv"),"utf8"));
const manifest=[...firstManifest.map(r=>({...r,media_role:"primary_demo",batch:"app6d2"})),...secondManifest.map(r=>({...r,batch:"app6d2a"}))];
const manifestColumns=[...new Set(manifest.flatMap(Object.keys))];
await writeFile(path.join(docs,"MEDIA_SOURCE_DERIVATIVE_MANIFEST.csv"),csv(manifest,manifestColumns));
const firstReview=parseCsv(await readFile(path.join(root,"docs/mobile/app6d2/MEDIA_REVIEW_RESULTS.csv"),"utf8"));
const combinedReview=[...firstReview.map(r=>({...r,media_role:"primary_demo",batch:"app6d2"})),...review.map(r=>({...r,batch:"app6d2a"}))];
const reviewColumns=[...new Set(combinedReview.flatMap(Object.keys))];
await writeFile(path.join(docs,"QUALITY_AND_SAFETY_REVIEW.csv"),csv(combinedReview,reviewColumns));
const first52=firstReview.map(r=>({asset_id:r.asset_id,canonical_slug:r.canonical_slug,visual_mapping_review:r.visual_mapping_review,media_role:"primary_demo",derivative_ready:r.visual_mapping_review==="approved_candidate"?"true":"false",fallback_preserved:"true",activation:"disabled",review_note:r.review_note}));
await writeFile(path.join(docs,"FIRST_52_ACTIVATION_MATRIX.csv"),csv(first52,Object.keys(first52[0])));
const canonical=review.map(r=>({asset_id:r.asset_id,canonical_slug:r.canonical_slug,decision:r.visual_mapping_review==="rejected"?"rejected":r.media_role==="technique_tip"?"supplemental_existing_exercise":"existing_exercise_upgrade",new_exercise_id:"",new_exercise_approved:"false",media_role:r.media_role,activation:"disabled",reason:r.review_note}));
await writeFile(path.join(docs,"CANONICAL_MATCH_AND_NEW_EXERCISES.csv"),csv(canonical,Object.keys(canonical[0])));
const links=manifest.map(r=>({idempotencyKey:`${r.asset_id}:${r.canonical_slug}:${r.media_role||"primary_demo"}:1`,assetId:r.asset_id,canonicalSlug:r.canonical_slug,mediaRole:r.media_role||"primary_demo",videoStorageKey:r.storage_key,posterStorageKey:r.poster_storage_key,active:false,featureFlag:"exercise_media_6d2",version:1}));
const state=new Map();for(const link of links)state.set(link.idempotencyKey,link);const replay=new Map([...state,...links.map(link=>[link.idempotencyKey,link])]);if(state.size!==links.length||replay.size!==links.length)throw new Error("Import plan is not idempotent");
const digest=createHash("sha256").update(JSON.stringify(links)).digest("hex");
await writeFile(path.join(docs,"import-plan.json"),`${JSON.stringify({version:2,active:false,count:links.length,digest,rows:links},null,2)}\n`);
const counts=Object.fromEntries([...new Set(master.map(r=>r.disposition))].sort().map(status=>[status,master.filter(r=>r.disposition===status).length]));
await writeFile(path.join(docs,"disposition-summary.json"),`${JSON.stringify({version:2,inventoryRows:master.length,digest:createHash("sha256").update(JSON.stringify(master)).digest("hex"),counts,importLinks:links.length,importDigest:digest},null,2)}\n`);
console.log(JSON.stringify({counts,manifest:manifest.length,importLinks:links.length,digest},null,2));
