const DAY_MS=86_400_000;
export function isDateOnly(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const[y,m,d]=value.split("-").map(Number),date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d}
export function dateOnlyFromLocal(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
export function addCalendarDays(value:string,days:number){const[y,m,d]=value.split("-").map(Number),date=new Date(Date.UTC(y,m-1,d+days));return date.toISOString().slice(0,10)}
export function nextMonday(value:string){const[y,m,d]=value.split("-").map(Number),weekday=new Date(Date.UTC(y,m-1,d)).getUTCDay();return addCalendarDays(value,weekday===1?7:(8-weekday)%7)}
export function daysBetween(from:string,to:string){const parse=(value:string)=>{const[y,m,d]=value.split("-").map(Number);return Date.UTC(y,m-1,d)};return Math.round((parse(to)-parse(from))/DAY_MS)}
export function formatProgramDate(value:string){const[y,m,d]=value.split("-").map(Number);return new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,d)))}
