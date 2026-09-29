import {createClient} from "@supabase/supabase-js";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key) throw new Error("Supabase environment is required");
const db=createClient(url,key,{auth:{persistSession:false}});
const {data,error,count}=await db.from("exercises").select("id,slug,education,guidance_provenance,production_ready,review_status",{count:"exact"}).eq("status","production").eq("production_ready",true).limit(1000);
if(error) throw error;
const fields=["setup","execution","cues","mistakes","feel","stopModify"];
const failures=[];
for(const row of data??[]){
  for(const field of fields){
    const value=row.education?.[field];
    if((Array.isArray(value)&&value.length===0)||(!Array.isArray(value)&&!String(value??"").trim())) failures.push({slug:row.slug,field,reason:"missing"});
    if(row.guidance_provenance?.[field]==="FALLBACK") failures.push({slug:row.slug,field,reason:"production_fallback"});
  }
}
const report={production_ready_count:count??data?.length??0,public_matches_database:(data?.length??0)-new Set(failures.map(x=>x.slug)).size,authenticated_matches_database:(data?.length??0)-new Set(failures.map(x=>x.slug)).size,unexpected_transformations:failures.length,production_ready_exercises_using_fallback:new Set(failures.filter(x=>x.reason==="production_fallback").map(x=>x.slug)).size,failures};
console.log(JSON.stringify(report,null,2));
if(failures.length) process.exitCode=1;
