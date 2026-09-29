import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const restored=JSON.parse(fs.readFileSync(path.join(root,"content/exercises/restored-exercises.json"),"utf8"));
const expansion=JSON.parse(fs.readFileSync(path.join(root,"content/exercises/vital-provider-expansion.json"),"utf8"));
const normalize=x=>({
  ...x,
  pattern:x.pattern??x.movement_pattern,
  primaryMuscles:x.primaryMuscles??x.primary_muscles??[],
  secondaryMuscles:x.secondaryMuscles??x.secondary_muscles??[],
  requiredEquipment:x.requiredEquipment??x.required_equipment??[],
  videoPath:x.media?.videoPath??x.videoPath,
  posterPath:x.media?.posterPath??x.posterPath,
});
const records=[...new Map([...restored,...expansion].map(x=>[x.slug,normalize(x)])).values()].sort((a,b)=>a.slug.localeCompare(b.slug));
const bySlug=new Map(records.map(x=>[x.slug,x]));
const issues=[];
const add=(exercise,field,problem,severity,correction)=>issues.push({exercise:exercise.slug,field,problem,severity,correction});
const boilerplate=[
  "Move smoothly into the working range while keeping the listed primary muscles in control.",
  "Keep every repetition deliberate and repeatable.",
  "Choose a load or variation that lets you hold the starting position without strain.",
  "Build controlled strength and skill in the listed primary muscles.",
];
const equipmentHints={barbell:["barbell"],dumbbells:["dumbbell"],cables:["cable"],machines:["machine"],bands:["band"],bodyweight:["bodyweight"]};

for(const exercise of records){
  const text=JSON.stringify(exercise).toLowerCase();
  const education=exercise.education??{};
  for(const field of ["setup","execution","cues","mistakes"]){
    const values=education[field]??exercise[field]??[];
    if(!Array.isArray(values)||values.length<2)add(exercise,field,"Missing or too little exercise-specific guidance.","high","Add at least two reviewed, movement-specific instructions.");
    const repeated=values.filter(x=>boilerplate.includes(x));
    if(repeated.length)add(exercise,field,`Contains ${repeated.length} generic template sentence(s).`,"medium","Replace only the generic sentence with movement-specific coaching language.");
  }
  if(!education.feel)add(exercise,"what-you-should-feel","Missing what-you-should-feel guidance.","high","Add the expected muscular effort and distinguish it from joint-focused pain.");
  if(!education.stopModify)add(exercise,"cautions","Missing stop/modify guidance.","high","Add concise safety and modification guidance without diagnosing.");
  if(!exercise.primaryMuscles?.length)add(exercise,"primary muscles","No primary muscle is recorded.","critical","Assign the reviewed primary muscle group.");
  if(!exercise.pattern)add(exercise,"movement pattern","No movement pattern is recorded.","critical","Assign the reviewed movement pattern.");
  for(const alt of exercise.alternatives??[]){
    const candidate=bySlug.get(typeof alt==="string"?alt:alt.slug);
    if(!candidate){add(exercise,"substitutions",`Alternative ${typeof alt==="string"?alt:alt.slug} is missing from the catalog.`,"high","Remove it or map it to an existing reviewed exercise.");continue;}
    const overlap=(exercise.primaryMuscles??[]).some(m=>candidate.primaryMuscles?.includes(m));
    if(!overlap)add(exercise,"substitutions",`${candidate.slug} does not share a primary muscle.`,"critical","Replace with an alternative that preserves the target muscle and training purpose.");
  }
  if(exercise.videoPath){
    const local=path.join(root,"public",exercise.videoPath.replace(/^\//,""));
    if(!fs.existsSync(local))add(exercise,"instructional media",`Mapped video is missing: ${exercise.videoPath}.`,"high","Correct the media path or leave the guide instructional-only.");
    const fileSlug=path.basename(exercise.videoPath,".mp4");
    if(fileSlug!==exercise.slug)add(exercise,"instructional media",`Video slug ${fileSlug} does not exactly match the exercise slug.`,"medium","Manually verify the movement and document the intentional alias, or correct the mapping.");
  }
  for(const [equipment,hints] of Object.entries(equipmentHints)){
    if((exercise.requiredEquipment??[]).includes(equipment)&&!hints.some(h=>text.includes(h)))add(exercise,"equipment",`${equipment} is recorded but not reflected in the customer-facing content.`,"medium","Verify equipment metadata and add exercise-specific setup language.");
  }
}

const counts=issues.reduce((m,x)=>(m[x.severity]=(m[x.severity]??0)+1,m),{});
const lines=["# Exercise content integrity audit","",`Generated: ${new Date().toISOString()}`,`Records audited: **${records.length}**`,`Issues flagged: **${issues.length}** (${Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join(", ")||"none"})`,"","## Method","","Every locally versioned production exercise was checked for required education fields, generic template language, primary-muscle-safe alternatives, missing alternative records, equipment/content consistency, and local media-path integrity. Semantic flags require human review; the audit does not silently rewrite coaching content.","","## Findings","","| Exercise | Field | Problem | Severity | Recommended correction |","| --- | --- | --- | --- | --- |",...issues.map(x=>`| ${x.exercise} | ${x.field} | ${x.problem.replaceAll("|","\\|")} | ${x.severity} | ${x.correction.replaceAll("|","\\|")} |`),"","## Release rule","","Critical and high findings must be reviewed before affected content is newly marked production-ready. Generic-copy flags should be corrected in editorial batches, preserving any shared language that is genuinely appropriate."];
fs.writeFileSync(path.join(root,"docs/exercise-content-integrity-audit.md"),lines.join("\n")+"\n");
console.log(JSON.stringify({records:records.length,issues:issues.length,counts},null,2));
