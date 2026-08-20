"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

export type LibraryExercise = { slug:string; name:string; purpose:string|null; primary_muscles:string[]; required_equipment:string[]; settings:string[] };
const pretty=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const exerciseSettings=(exercise:LibraryExercise)=>{
  const equipment=exercise.required_equipment;
  const values=["commercial_gym"];
  if(equipment.every(x=>["bodyweight","bands","dumbbells","bench"].includes(x)))values.push("home_gym");
  if(equipment.every(x=>["bodyweight","bands"].includes(x)))values.push("travel");
  return values;
};

export function ExerciseLibraryBrowser({exercises}:{exercises:LibraryExercise[]}){
  const[query,setQuery]=useState(""),[muscle,setMuscle]=useState("all"),[equipment,setEquipment]=useState("all"),[setting,setSetting]=useState("all");
  const muscles=useMemo(()=>[...new Set(exercises.flatMap(x=>x.primary_muscles))].sort(),[exercises]);
  const equipmentOptions=useMemo(()=>[...new Set(exercises.flatMap(x=>x.required_equipment))].sort(),[exercises]);
  const settings=["commercial_gym","home_gym","travel"];
  const visible=exercises.filter(x=>(!query||`${x.name} ${x.primary_muscles.join(" ")} ${x.required_equipment.join(" ")}`.toLowerCase().includes(query.toLowerCase()))&&(muscle==="all"||x.primary_muscles.includes(muscle))&&(equipment==="all"||x.required_equipment.includes(equipment))&&(setting==="all"||exerciseSettings(x).includes(setting)));
  return <>
    <section className="exercise-library-controls" aria-label="Filter exercise library">
      <label>Search<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search exercises or muscles"/></label>
      <label>Muscle<select value={muscle} onChange={e=>setMuscle(e.target.value)}><option value="all">All muscles</option>{muscles.map(x=><option value={x} key={x}>{pretty(x)}</option>)}</select></label>
      <label>Equipment<select value={equipment} onChange={e=>setEquipment(e.target.value)}><option value="all">All equipment</option>{equipmentOptions.map(x=><option value={x} key={x}>{pretty(x)}</option>)}</select></label>
      {settings.length?<label>Setting<select value={setting} onChange={e=>setSetting(e.target.value)}><option value="all">All settings</option>{settings.map(x=><option value={x} key={x}>{pretty(x)}</option>)}</select></label>:null}
    </section>
    <p className="exercise-result-count" aria-live="polite">Showing {visible.length} of {exercises.length} exercises</p>
    <div className="exercise-grid">{visible.map(x=><Link href={`/exercises/${x.slug}`} key={x.slug}><span>{x.required_equipment.join(" · ")}</span><h2>{x.name}</h2><p>{x.purpose}</p></Link>)}</div>
    {!visible.length?<div className="exercise-empty"><h2>No exercises match those filters.</h2><button className="button secondary" type="button" onClick={()=>{setQuery("");setMuscle("all");setEquipment("all");setSetting("all")}}>Clear filters</button></div>:null}
  </>;
}
