import type{TrainingProgram}from"@/modules/training/types";import{addCalendarDays,isDateOnly}from"@/modules/programs/start-date";
export type CalendarEvent={id:string;date:string;type:"workout"|"checkin"|"progress";title:string;detail:string;href:string;status:"scheduled"|"completed"};
const dayIndex:Record<string,number>={sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6};
const defaults:Record<number,number[]>={2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6]};
function weekday(value:string){const[y,m,d]=value.split("-").map(Number);return new Date(Date.UTC(y,m-1,d)).getUTCDay()}
function selectedWeekdays(count:number,preferredDays:string[]){const selected=[...new Set(preferredDays.map(day=>dayIndex[day.toLowerCase()]).filter((day):day is number=>day!==undefined))];return selected.length===count?selected:defaults[count]??defaults[3]}
export function firstWorkoutDate(programStartDate:string,preferredDays:string[],workoutCount:number){const selected=new Set(selectedWeekdays(workoutCount,preferredDays));for(let offset=0;offset<7;offset++){const date=addCalendarDays(programStartDate,offset);if(selected.has(weekday(date)))return date}return programStartDate}
export function buildProgramSchedule(program:TrainingProgram,programStartDate:string,preferredDays:string[]=[],completed:Record<string,string>={},checkins:string[]=[]){
 if(!isDateOnly(programStartDate))throw new Error("INVALID_PROGRAM_START_DATE");
 const events:CalendarEvent[]=[],selected=new Set(selectedWeekdays(program.workouts.length,preferredDays));
 for(let week=0;week<program.weeks;week++){
  const weekStart=addCalendarDays(programStartDate,week*7),workoutDates=Array.from({length:7},(_,offset)=>addCalendarDays(weekStart,offset)).filter(date=>selected.has(weekday(date))).slice(0,program.workouts.length);
  program.workouts.forEach((workout,index)=>{const date=workoutDates[index]??addCalendarDays(weekStart,index),completedDate=completed[workout.key];events.push({id:`workout-${week}-${workout.key}`,date,type:"workout",title:workout.name,detail:`Week ${week+1} · ${workout.estimatedMinutes} min`,href:"/app/workout",status:completedDate?.slice(0,10)===date?"completed":"scheduled"})});
  const reviewDate=addCalendarDays(weekStart,6),checkinComplete=checkins.includes(weekStart);events.push({id:`checkin-${week}`,date:reviewDate,type:"checkin",title:"Weekly check-in",detail:`Week ${week+1} recovery review`,href:"/app/checkin",status:checkinComplete?"completed":"scheduled"});events.push({id:`progress-${week}`,date:reviewDate,type:"progress",title:"Progress review",detail:"Review adherence and trajectory",href:"/app/progress",status:checkinComplete?"completed":"scheduled"});
 }
 return events
}
