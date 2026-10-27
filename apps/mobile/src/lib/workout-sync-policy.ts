export function canonicalJson(value:unknown):string{
  if(Array.isArray(value))return `[${value.map(canonicalJson).join(",")}]`;
  if(value&&typeof value==="object")return `{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
export function retryDelayMs(attempt:number){return Math.min(300_000,1_000*2**Math.min(Math.max(0,attempt),9));}
export function shouldPreserveAsConflict(status:number){return status===409;}
