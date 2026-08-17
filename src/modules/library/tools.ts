export const METHODOLOGY_VERSION="2026.08";
export const tools=[
 {slug:"calorie-tdee",title:"Calorie & TDEE Calculator",summary:"Estimate the energy your body uses in a typical day.",kind:"body"},
 {slug:"macro",title:"Macro Calculator",summary:"Turn a calorie target into practical protein, fat, and carbohydrate ranges.",kind:"body"},
 {slug:"protein",title:"Protein Calculator",summary:"Estimate a useful daily protein range for your goal.",kind:"body"},
 {slug:"weight-loss-timeline",title:"Weight-Loss Timeline",summary:"Explore a deliberately conservative weight-loss timeline.",kind:"body"},
 {slug:"lean-gain-target",title:"Lean-Gain Target",summary:"Set a restrained rate of gain that supports training.",kind:"body"},
 {slug:"bmi-context",title:"BMI with Context",summary:"Calculate BMI and understand what it can—and cannot—tell you.",kind:"body"},
 {slug:"lean-body-mass",title:"Lean Body Mass",summary:"Estimate lean mass from body weight and a body-fat estimate.",kind:"composition"},
 {slug:"one-rep-max",title:"One-Rep Max Calculator",summary:"Estimate 1RM from a submaximal set without testing a maximum.",kind:"strength"},
 {slug:"training-max",title:"Training Max Calculator",summary:"Create a conservative working maximum from an estimated 1RM.",kind:"strength"},
 {slug:"plate-calculator",title:"Barbell Plate Calculator",summary:"Find the plates needed on each side of a standard bar.",kind:"plates"},
 {slug:"training-volume",title:"Training Volume Calculator",summary:"Calculate simple set volume and interpret it carefully.",kind:"volume"},
 {slug:"running-pace",title:"Running Pace Calculator",summary:"Convert distance and finish time into pace and speed.",kind:"running"},
 {slug:"race-time",title:"Race Pace & Time Converter",summary:"Project finish time at a chosen pace.",kind:"race"},
 {slug:"heart-rate-zones",title:"Heart-Rate Zone Calculator",summary:"Estimate broad training zones from age and resting heart rate.",kind:"heart"},
 {slug:"workout-frequency",title:"Workout Frequency Recommender",summary:"Choose a weekly structure you can realistically repeat.",kind:"schedule"},
] as const;
export type ToolSlug=typeof tools[number]["slug"];
export function findTool(slug:string){return tools.find(t=>t.slug===slug)}
export type ToolInput={weightKg:number;heightCm:number;age:number;sex:"female"|"male";activity:number;goal:"lose"|"maintain"|"gain";bodyFat:number;loadKg:number;reps:number;barKg:number;sets:number;distanceKm:number;minutes:number;restingHr:number;days:number};
export type ToolResult={headline:string;detail:string;limitations:string};
const round=(n:number,step=1)=>Math.round(n/step)*step;
export function calculate(slug:ToolSlug,i:ToolInput):ToolResult{
 const bmr=10*i.weightKg+6.25*i.heightCm-5*i.age+(i.sex==="male"?5:-161);const tdee=round(bmr*i.activity,50);const protein=[round(i.weightKg*1.6,5),round(i.weightKg*2,5)];
 switch(slug){
  case"calorie-tdee":return{headline:`About ${tdee.toLocaleString()} kcal/day`,detail:"Treat this as a starting estimate. Compare it with two to four weeks of body-weight and intake trends, then adjust.",limitations:"Equations estimate populations; individual energy use varies."};
  case"macro":{const calories=i.goal==="lose"?tdee-350:i.goal==="gain"?tdee+200:tdee;const p=protein[0],fat=round(i.weightKg*.7,5),carb=round((calories-p*4-fat*9)/4,5);return{headline:`${p}g protein · ${fat}g fat · about ${carb}g carbohydrate`,detail:`A flexible starting structure near ${calories} kcal/day. Foods do not need to match these numbers perfectly.`,limitations:"Medical conditions, pregnancy, and eating-disorder history need individualized care."}}
  case"protein":return{headline:`${protein[0]}–${protein[1]} g/day`,detail:`Spread this across meals in amounts you can repeat. The upper end is an option, not a pass/fail line.`,limitations:"Kidney disease or a prescribed diet warrants clinician guidance."};
  case"weight-loss-timeline":{const weekly=i.weightKg*.005;return{headline:`About ${round(weekly,.1)} kg/week`,detail:"A moderate starting pace is roughly 0.5% of body weight per week. Day-to-day scale changes are mostly not fat.",limitations:"This is a planning range, not a promise; stop and reassess if wellbeing or performance deteriorates."}}
  case"lean-gain-target":return{headline:`About ${round(i.weightKg*.0025,.1)} kg/week`,detail:"Use a small surplus, progressive training, and a monthly trend rather than reacting to single weigh-ins.",limitations:"Faster scale gain is not necessarily faster muscle gain."};
  case"bmi-context":{const bmi=i.weightKg/((i.heightCm/100)**2);return{headline:`BMI ${bmi.toFixed(1)}`,detail:"BMI is a screening ratio. It cannot separate muscle from fat or describe fitness, health behavior, or worth.",limitations:"Interpret alongside clinical context, body composition, history, and other health measures."}}
  case"lean-body-mass":return{headline:`About ${round(i.weightKg*(1-i.bodyFat/100),.1)} kg lean mass`,detail:"This subtracts the entered body-fat estimate from body weight. Tracking the same method matters more than decimals.",limitations:"Consumer body-fat estimates often have meaningful error."};
  case"one-rep-max":{const max=round(i.loadKg*(1+i.reps/30),.5);return{headline:`Estimated 1RM: ${max} kg`,detail:"Epley estimate. Sets of roughly 3–10 controlled repetitions are generally more useful than very high-rep sets.",limitations:"Do not treat an estimate as permission to attempt a maximal lift without appropriate skill and setup."}}
  case"training-max":return{headline:`Training max: ${round(i.loadKg*(1+i.reps/30)*.9,.5)} kg`,detail:"This is 90% of the Epley estimated 1RM, leaving room for normal daily variation.",limitations:"Adjust down when technique, pain, illness, or recovery calls for it."};
  case"plate-calculator":{const side=Math.max(0,(i.loadKg-i.barKg)/2);return{headline:`${round(side,.25)} kg per side`,detail:`Load the same total on each side of the ${i.barKg} kg bar. Use available plates to build outward from larger to smaller.`,limitations:"Confirm the bar and collars, and never exceed equipment ratings."}}
  case"training-volume":return{headline:`${round(i.sets*i.reps*i.loadKg).toLocaleString()} kg set volume`,detail:"Volume load can compare similar versions of the same lift; it does not measure stimulus or quality by itself.",limitations:"Do not compare unrelated exercises using tonnage alone."};
  case"running-pace":{const pace=i.minutes/i.distanceKm;return{headline:`${Math.floor(pace)}:${String(Math.round((pace%1)*60)).padStart(2,"0")} min/km`,detail:`Average speed: ${(60/pace).toFixed(1)} km/h. Use effort and conditions alongside pace.`,limitations:"Terrain, weather, stops, and measurement error affect real-world pace."}}
  case"race-time":return{headline:`Projected time: ${Math.floor(i.minutes*i.distanceKm/60)}h ${Math.round((i.minutes*i.distanceKm)%60)}m`,detail:"This multiplies an entered pace in minutes per kilometre by distance. It is arithmetic, not a race-performance prediction.",limitations:"Fatigue makes longer-distance outcomes nonlinear."};
  case"heart-rate-zones":{const max=208-.7*i.age,reserve=max-i.restingHr;return{headline:`Easy aerobic: ${round(i.restingHr+reserve*.6)}–${round(i.restingHr+reserve*.7)} bpm`,detail:"Karvonen estimate using resting heart rate. Use the talk test and perceived effort when devices or conditions disagree.",limitations:"Medication and health conditions can change heart-rate response; seek clinical guidance when appropriate."}}
  case"workout-frequency":{const structure=i.days<=2?"Two full-body days":i.days===3?"Three full-body days":i.days===4?"Upper/lower across four days":"Three strength days plus optional lighter work";return{headline:structure,detail:"Choose days you can repeat for eight weeks. Each major movement can appear more than once without making every day hard.",limitations:"More days are not automatically better; recovery and adherence set the useful dose."}}
 }
}
