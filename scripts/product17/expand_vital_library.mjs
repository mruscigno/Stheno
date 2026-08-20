import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd(), providerRoot=path.resolve(process.argv[2]??path.join(ROOT,"..","work","vital-animations"));
const base=JSON.parse(await readFile(path.join(ROOT,"content/exercises/canonical-exercises.json"),"utf8"));
const existingManifest=JSON.parse(await readFile(path.join(ROOT,"src/modules/exercise-media/vital-manifest.json"),"utf8"));
const collections=[
  ["100-gym-workouts","100 Gym Workouts/100gymworkouts.json","100 Gym Workouts/100gymworkouts"],
  ["100-workouts","100 Workouts/100workouts.json","100 Workouts/100 Workouts"],
  ["200-workouts","200 Workouts/200workouts.json","200 Workouts/200 Workouts"],
];
const swaps=new Map([["one arm","single arm"],["one leg","single leg"],["pull up","pullup"],["push up","pushup"],["workout",""],["exercise",""],["body weight","bodyweight"],["hyperextension","back extension"],["kick back","kickback"],["lat pull down","lat pulldown"],["tricep","triceps"],["bicep","biceps"]]);
const normalize=(v)=>{let s=String(v??"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();for(const[a,b]of swaps)s=s.replaceAll(a,b);return s.replace(/\s+/g," ").trim()};
const slugify=(v)=>normalize(v).replaceAll(" ","-");
const tokenSet=(v)=>new Set(normalize(v).split(" ").filter(Boolean));
const jaccard=(a,b)=>{const x=tokenSet(a),y=tokenSet(b),n=[...x].filter(t=>y.has(t)).length;return n/Math.max(1,x.size+y.size-n)};
const title=(v)=>String(v).replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bEz\b/g,"EZ").replace(/\bT Bar\b/g,"T-Bar");
const canonicalNames=base.map(x=>x.name);
const usedProvider=new Set(Object.values(existingManifest).map(x=>x.providerExerciseId));
const obviousAliases=[/45 degree hyperextension/,/cable leg kickback/,/incline pushup/,/decline pushup/,/standing arnold press/,/assisted pullup/,/seated calf press/,/lying leg curl/,/seated leg curl/,/leg extension machine/,/chest press machine/,/pec deck/,/lat pulldown machine/];
const providers=[];
for(const [collection,json,videos] of collections){const rows=JSON.parse(await readFile(path.join(providerRoot,json),"utf8"));for(const [i,row] of rows.entries()){const id=row.id||String(i+1).padStart(4,"0"),providerKey=`${collection}:${id}`,sourcePath=path.join(providerRoot,videos,`${id}.mp4`);await stat(sourcePath);providers.push({...row,id,collection,providerKey,sourcePath});}}
const groups=new Map();for(const p of providers){const key=normalize(p.name);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)}
const selected=[];const excluded=[];const occupied=new Set(base.map(x=>x.slug));
for(const group of groups.values()){
  const p=group.find(x=>!usedProvider.has(x.providerKey))??group[0];
  const ranked=canonicalNames.map(name=>({name,score:jaccard(name,p.name)})).sort((a,b)=>b.score-a.score);
  const exact=ranked[0].score===1, alias=obviousAliases.some(rx=>rx.test(normalize(p.name)));
  if(exact||alias||ranked[0].score>=0.58){excluded.push({providerKey:p.providerKey,name:p.name,reason:exact?"existing_normalized_identity":alias?"known_alias":`probable_alias:${ranked[0].name}`,score:Number(ranked[0].score.toFixed(3))});continue;}
  let slug=slugify(p.name);if(occupied.has(slug)){excluded.push({providerKey:p.providerKey,name:p.name,reason:"slug_collision"});continue;}occupied.add(slug);selected.push({...p,slug});
}
const muscle=(v)=>{const s=normalize(v);if(/abs|oblique/.test(s))return"core";if(/lat|trap|rhomboid|back|spinae/.test(s))return"back";if(/delt|shoulder/.test(s))return"shoulders";if(/pectoral|chest/.test(s))return"chest";if(/quad/.test(s))return"quadriceps";if(/glute/.test(s))return"glutes";if(/hamstring/.test(s))return"hamstrings";if(/calf|calves/.test(s))return"calves";if(/forearm|lower arm/.test(s))return"forearms";if(/biceps/.test(s))return"biceps";if(/triceps/.test(s))return"triceps";return s||"full_body"};
const equipment=(v)=>{const s=normalize(v);if(s.includes("dumbbell"))return["dumbbells"];if(s.includes("barbell")||s.includes("ez bar"))return["barbell"];if(s.includes("kettlebell"))return["kettlebells"];if(s.includes("cable"))return["cables"];if(s.includes("band"))return["bands"];if(s.includes("medicine ball"))return["medicine_ball"];if(s.includes("machine")||s.includes("assisted"))return["machines"];if(s.includes("bench"))return["bench"];return["bodyweight"]};
const pattern=(n)=>{const s=normalize(n);if(/squat/.test(s))return"squat";if(/lunge|split squat|step up/.test(s))return"lunge";if(/deadlift|good morning|hip thrust|bridge|back extension|swing/.test(s))return"hinge";if(/carry|farmers walk/.test(s))return"carry";if(/pullup|pulldown|chin up/.test(s))return"vertical_pull";if(/overhead press|shoulder press|military press|pike pushup/.test(s))return"vertical_push";if(/row/.test(s))return"horizontal_pull";if(/bench press|chest press|pushup|chest fly/.test(s))return"horizontal_push";return"isolation"};
const risky=(p)=>/stretch|mobility|balance/.test(normalize(p.category))||/headstand|handstand|forearm stand|crow pose|neck/.test(normalize(p.name));
const records=selected.map(p=>{const primary=[muscle(p.target)],secondary=[...new Set((p.secondaryMuscles??[]).map(muscle))].filter(x=>!primary.includes(x));const eq=equipment(p.equipment),pat=pattern(p.name),instructions=(p.instructions??[]).filter(Boolean);return{
  slug:p.slug,name:title(p.name),family:normalize(p.bodyPart).replaceAll(" ","_")||"general",movement_pattern:pat,exercise_role:pat==="isolation"?"accessory":"secondary",primary_muscles:primary,secondary_muscles:secondary,required_equipment:eq,skill_level:["beginner","intermediate","advanced"].includes(p.difficulty)?p.difficulty:"beginner",fatigue_cost:p.difficulty==="advanced"?3:2,progression_suitability:risky(p)?2:4,rep_min:8,rep_max:15,
  education:{setup:instructions.slice(0,2).length?instructions.slice(0,2):[`Prepare a clear area for the ${title(p.name)}.`,`Use a stable starting position and comfortable range.`],execution:instructions.slice(2).length?instructions.slice(2):[`Perform each repetition under control.`,`Return to the start without losing position.`],cues:["Move with control through a comfortable range.","Keep your breathing steady and your joints aligned.","Stop the set before technique changes."],mistakes:["Rushing the movement or using momentum.","Forcing a range that causes pain.","Losing the intended starting position."],feel:`Expect the ${primary.join(" and ")} to do most of the work, without sharp or joint-focused pain.`,stopModify:"Stop or shorten the range for sharp, sudden, worsening, or joint-focused pain."},
  caution_tags:risky(p)?["advanced_or_mobility_movement","use_a_comfortable_pain_free_range"]:["stop_for_sharp_or_worsening_pain"],purpose:p.description||`A ${p.category||"fitness"} movement for the ${primary.join(" and ")}.`,media_provenance:"Vital Animations licensed provider asset",prescribable:!risky(p),public_indexable:true,exercise_type:normalize(p.category)||"strength",settings:[eq[0]==="bodyweight"?"home":"gym"],provider:{key:p.providerKey,collection:p.collection,id:p.id,name:p.name,equipment:p.equipment,target:p.target,sourcePath:path.relative(providerRoot,p.sourcePath).replaceAll("\\","/")}
}});
const report={generatedAt:new Date().toISOString(),baseExercises:base.length,providerRecords:providers.length,providerUniqueNames:groups.size,added:records.length,totalLibrary:base.length+records.length,excluded:excluded.length,method:"Conservative semantic deduplication; exact, known-alias, and token-overlap candidates remain excluded."};
await mkdir(path.join(ROOT,"content/exercises"),{recursive:true});await writeFile(path.join(ROOT,"content/exercises/vital-provider-expansion.json"),JSON.stringify(records,null,2)+"\n");await writeFile(path.join(ROOT,"content/exercises/vital-provider-expansion-report.json"),JSON.stringify({...report,excluded},null,2)+"\n");
console.log(JSON.stringify(report,null,2));
