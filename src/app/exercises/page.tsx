import type {Metadata} from "next";
import Link from "next/link";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {ExerciseLibraryBrowser,type LibraryExercise} from "@/components/exercises/exercise-library-browser";
export const metadata:Metadata={title:"Reviewed Exercise Library",description:"Browse 330 production-ready exercises with videos, setup, coaching cues, and muscle-matched alternatives.",alternates:{canonical:"/exercises"}};
export default async function Exercises(){
  const db=await createSupabaseServerClient();
  const{data}=db?await db.from("exercises").select("slug,name,purpose,primary_muscles,required_equipment,settings").eq("status","production").eq("review_status","reviewed").eq("prescribable",true).eq("public_indexable",true).eq("technical_review_status","reviewed").eq("editorial_review_status","reviewed").eq("visual_review_status","reviewed").eq("production_ready",true).order("name").limit(400):{data:[]};
  const exercises=(data??[]) as LibraryExercise[];
  return <main className="public-page shell"><nav className="breadcrumbs"><Link href="/library">Library</Link> / Exercises</nav><p className="eyebrow">{exercises.length} production-ready movements</p><h1>Exercise Library</h1><p className="lede">Search every STHENO exercise by name, muscle, or equipment. Each guide includes a reviewed movement video, practical instruction, anatomy, and alternatives.</p><ExerciseLibraryBrowser exercises={exercises}/></main>;
}
