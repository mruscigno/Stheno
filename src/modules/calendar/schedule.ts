import type{TrainingProgram}from"@/modules/training/types";
export type CalendarEvent={id:string;date:string;type:"workout"|"checkin"|"progress";title:string;detail:string;href:string;status:"scheduled"|"completed"};
const dayIndex:Record<string,number>={sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6};
const defaults:Record<number,number[]>={2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6]};
const iso=(date:Date)=>date.toISOString().slice(0,10);
function mondayOnOrAfter(value:string){const date=new Date(`${value.slice(0,10)}T12:00:00Z`),day=date.getUTCDay(),offset=day===0?1:day===1?0:8-day;date.setUTCDate(date.getUTCDate()+offset);return date}
export function buildProgramSchedule(program:TrainingProgram,prescribedAt:string,preferredDays:string[]=[],completed:Record<string,string>={},checkins:string[]=[]){
 const events:CalendarEvent[]=[],start=mondayOnOrAfter(prescribedAt),selected=[...new Set(preferredDays.map(day=>dayIndex[day.toLowerCase()]).filter((day):day is number=>day!==undefined&&day!==0))].slice(0,program.workouts.length),days=selected.length===program.workouts.length?selected.toSorted((a,b)=>a-b):defaults[program.workouts.length]??defaults[3];
 for(let week=0;week<program.weeks;week++){
  program.workouts.forEach((workout,index)=>{const date=new Date(start);date.setUTCDate(start.getUTCDate()+week*7+(days[index]??index+1)-1);const key=iso(date),completedDate=completed[workout.key];events.push({id:`workout-${week}-${workout.key}`,date:key,type:"workout",title:workout.name,detail:`Week ${week+1} · ${workout.estimatedMinutes} min`,href:"/app/workout",status:completedDate?.slice(0,10)===key?"completed":"scheduled"})});
  const weekStart=new Date(start);weekStart.setUTCDate(start.getUTCDate()+week*7);const checkinComplete=checkins.includes(iso(weekStart)),sunday=new Date(weekStart);sunday.setUTCDate(weekStart.getUTCDate()+6);const sundayIso=iso(sunday);
  events.push({id:`checkin-${week}`,date:sundayIso,type:"checkin",title:"Weekly check-in",detail:`Week ${week+1} recovery review`,href:"/app/checkin",status:checkinComplete?"completed":"scheduled"});
  events.push({id:`progress-${week}`,date:sundayIso,type:"progress",title:"Progress review",detail:"Review adherence and trajectory",href:"/app/progress",status:checkinComplete?"completed":"scheduled"});
 }
 return events
}
