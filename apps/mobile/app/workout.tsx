import { useEffect, useMemo, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View, type AlertButton } from "react-native";
import { createPortableUuid } from "@shared/client/api-client";
import { Body, Button, Card, Eyebrow, Notice, Row, SectionTitle, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";
import { useWorkout } from "@/providers/WorkoutProvider";
import { colors, radius, spacing } from "@/theme";
import type { LocalWorkoutSet } from "@/lib/workout-store";
import { createMobileApiClient } from "@/lib/api";
import { journeyDiagnostic } from "@/lib/journey-diagnostics";

type ExercisePrescription={exerciseSlug:string;exerciseName?:string;name?:string;sets?:number;repMin?:number;repMax?:number;rir?:number;restSeconds?:number;alternatives?:string[];instructions?:string[]};
function prescriptions(value:Record<string,unknown>|undefined){return Array.isArray(value?.exercises)?value.exercises as ExercisePrescription[]:[];}
function secondsLabel(value:number){return `${Math.floor(value/60)}:${String(value%60).padStart(2,"0")}`;}

function SetRow({exercise,ordinal,saved,onSave}:{exercise:ExercisePrescription;ordinal:number;saved?:LocalWorkoutSet;onSave:(set:Omit<LocalWorkoutSet,"syncState">)=>Promise<void>}){
  const [setId]=useState(()=>saved?.setId??createPortableUuid()),[load,setLoad]=useState(saved?.load?.toString()??""),[reps,setReps]=useState(saved?.reps?.toString()??String(exercise.repMin??"")),[rir,setRir]=useState(saved?.rir?.toString()??String(exercise.rir??2)),[busy,setBusy]=useState(false);
  const done=saved?.state==="completed";
  async function commit(){setBusy(true);try{await onSave({setId,exerciseSlug:exercise.exerciseSlug,ordinal,load:load?Number(load):null,loadUnit:"lb",reps:reps?Number(reps):null,rir:rir?Number(rir):null,state:"completed"});}finally{setBusy(false);}}
  return <View style={styles.setRow}><Text style={styles.ordinal}>{ordinal}</Text><TextInput accessibilityLabel={`Set ${ordinal} weight`} keyboardType="decimal-pad" value={load} onChangeText={setLoad} placeholder="lb" style={styles.setInput}/><TextInput accessibilityLabel={`Set ${ordinal} repetitions`} keyboardType="number-pad" value={reps} onChangeText={setReps} placeholder="reps" style={styles.setInput}/><TextInput accessibilityLabel={`Set ${ordinal} repetitions in reserve`} keyboardType="decimal-pad" value={rir} onChangeText={setRir} placeholder="RIR" style={styles.smallInput}/><Pressable accessibilityRole="button" accessibilityLabel={`${done?"Update":"Complete"} set ${ordinal}`} disabled={busy} onPress={()=>void commit()} style={[styles.done,done&&styles.doneSaved]}><Text style={styles.doneText}>{busy?"…":done?"✓":"Done"}</Text></Pressable></View>;
}

export default function WorkoutScreen(){
  const auth=useAuth(),state=useWorkout(),router=useRouter(),params=useLocalSearchParams<{workoutKey?:string}>(),[clock,setClock]=useState(0),[finishing,setFinishing]=useState(false);
  const [history,setHistory]=useState<Record<string,{load_value:number|null;load_unit:string;repetitions:number|null}[]>>({});
  const programWorkouts=auth.program?.prescription.workouts??[],fallback=(programWorkouts.find(item=>item.key===params.workoutKey)??programWorkouts[0]) as unknown as Record<string,unknown>|undefined;
  useEffect(()=>{journeyDiagnostic("workout_route_mounted",{route:"/workout"});const id=setInterval(()=>setClock(Date.now()),1000);return()=>{clearInterval(id);journeyDiagnostic("workout_route_unmounted",{route:"/workout"});};},[]);
  const startWorkout=state.start,workout=state.workout;
  useEffect(()=>{if(workout||!fallback)return;const key=String(fallback.key??"workout-1");void startWorkout(key,fallback);},[fallback,startWorkout,workout]);
  const exerciseList=useMemo(()=>prescriptions(workout?.workout),[workout?.workout]);
  const online=state.online;
  useEffect(()=>{const slugs=exerciseList.map(item=>item.exerciseSlug);if(!slugs.length||!online)return;void createMobileApiClient().workoutHistory(slugs).then(response=>setHistory(response.data)).catch(()=>undefined);},[exerciseList,online]);
  if(auth.status==="signedOut")return <Redirect href="/"/>;
  if(auth.status!=="signedIn")return null;
  if(!workout)return <Screen><SthenoLogo/><Title>Preparing your workout…</Title><Body muted>Your session is being saved on this device first.</Body></Screen>;
  const elapsed=clock?Math.max(0,Math.floor((clock-new Date(workout.startedAt).getTime())/1000)):0,rest=clock&&workout.restExpiresAt?Math.max(0,Math.ceil((new Date(workout.restExpiresAt).getTime()-clock)/1000)):0;
  const completed=workout.sets.filter(set=>set.state==="completed").length,total=exerciseList.reduce((sum,item)=>sum+(item.sets??0),0);
  const syncLabel=state.online?(workout.pendingCount?"Saving…":"Saved"):"Offline · saved locally";
  async function finish(){setFinishing(true);try{await state.complete("about_right",completed<total);router.replace("/(member)");}finally{setFinishing(false);}}
  function chooseSubstitute(exercise:ExercisePrescription){const alternatives=exercise.alternatives??[];if(!alternatives.length){Alert.alert("No reviewed replacement available","Ask STHENO Coach to adjust this movement safely.");return;}const buttons:AlertButton[]=alternatives.slice(0,3).map(slug=>({text:slug.replaceAll("-"," "),onPress:()=>void state.substitute(exercise.exerciseSlug,slug,slug.replaceAll("-"," "))}));buttons.push({text:"Cancel",style:"cancel"});Alert.alert("Choose a replacement","This changes only the current workout.",buttons);}
  return <Screen footer={<Text testID="workout-sync-status" accessibilityLabel="Workout sync status" style={[styles.sync,styles.syncFooter,state.online?styles.online:styles.offline]}>{syncLabel}</Text>}><SthenoLogo/><Row><View><Eyebrow>Workout in progress</Eyebrow><Title>{String(workout.workout.name??"Today’s workout")}</Title></View><Text accessibilityLabel="Workout elapsed time" style={styles.timer}>{secondsLabel(elapsed)}</Text></Row>
    <Row><Body muted>{completed}/{total} sets complete</Body><Text style={[styles.sync,state.online?styles.online:styles.offline]}>{syncLabel}</Text></Row>
    {workout.status==="conflict"?<Notice tone="error">This workout changed elsewhere. Your local work is preserved; reconnect and retry before continuing.</Notice>:null}
    {rest>0?<Card><Row><SectionTitle>Rest timer</SectionTitle><Text style={styles.rest}>{secondsLabel(rest)}</Text></Row><Button variant="text" onPress={()=>void state.startRest(0)}>Skip rest</Button></Card>:null}
    {exerciseList.map((exercise,index)=>{const exerciseSets=workout.sets.filter(set=>set.exerciseSlug===exercise.exerciseSlug),previous=history[exercise.exerciseSlug]?.[0];return <Card key={exercise.exerciseSlug}><Row><View style={styles.exerciseHeading}><Eyebrow>{String(index+1).padStart(2,"0")}</Eyebrow><SectionTitle>{exercise.exerciseName??exercise.name??exercise.exerciseSlug.replaceAll("-"," ")}</SectionTitle></View><Button variant="text" onPress={()=>router.push(`/(member)/coach?exercise=${encodeURIComponent(exercise.exerciseSlug)}`)}>Ask Coach</Button></Row><Body muted>{exercise.sets??0} sets · {exercise.repMin??"—"}–{exercise.repMax??"—"} reps · {exercise.rir??2} RIR</Body><Body muted>{previous?`Previous: ${previous.load_value??"bodyweight"}${previous.load_value!=null?` ${previous.load_unit}`:""} × ${previous.repetitions??"—"}`:"No previous synced performance yet."}</Body><View style={styles.labels}><Text style={styles.label}>SET</Text><Text style={styles.label}>LB</Text><Text style={styles.label}>REPS</Text><Text style={styles.label}>RIR</Text><Text style={styles.label}>STATUS</Text></View>{Array.from({length:exercise.sets??0},(_,setIndex)=><SetRow key={`${exercise.exerciseSlug}-${setIndex+1}`} exercise={exercise} ordinal={setIndex+1} saved={exerciseSets.find(set=>set.ordinal===setIndex+1)} onSave={async set=>{await state.saveSet(set);await state.startRest(exercise.restSeconds??90);}}/>)}<Row><Button variant="text" onPress={()=>void Linking.openURL(`https://www.sthenofitness.com/exercises/${exercise.exerciseSlug}`)}>Exercise guide</Button><Button variant="secondary" onPress={()=>chooseSubstitute(exercise)}>Substitute</Button></Row></Card>;})}
    <Card><SectionTitle>Finish workout</SectionTitle><Body muted>Your completed sets are durable even if the app closes or your connection drops.</Body><Button busy={finishing} onPress={()=>void finish()}>Finish and save workout</Button></Card>
    <Button variant="secondary" onPress={()=>void state.sync()}>Retry sync</Button></Screen>;
}
const styles=StyleSheet.create({timer:{fontSize:24,fontWeight:"800",color:colors.ink},sync:{fontWeight:"800",fontSize:13},syncFooter:{textAlign:"center",paddingVertical:spacing.sm,borderTopWidth:1,borderTopColor:colors.line},online:{color:colors.success},offline:{color:colors.orangeDark},rest:{fontSize:36,fontWeight:"800",color:colors.orangeDark},exerciseHeading:{flex:1,minWidth:180},labels:{flexDirection:"row",gap:8,marginTop:spacing.sm},label:{flex:1,color:colors.muted,fontSize:10,fontWeight:"800"},setRow:{flexDirection:"row",alignItems:"center",gap:8},ordinal:{width:20,color:colors.muted,fontWeight:"800"},setInput:{flex:1,minHeight:46,borderWidth:1,borderColor:colors.line,borderRadius:radius.small,paddingHorizontal:10,color:colors.ink,backgroundColor:colors.paper},smallInput:{width:58,minHeight:46,borderWidth:1,borderColor:colors.line,borderRadius:radius.small,paddingHorizontal:8,color:colors.ink},done:{minWidth:58,minHeight:46,alignItems:"center",justifyContent:"center",borderRadius:radius.small,backgroundColor:colors.orange},doneSaved:{backgroundColor:"#d9efe2"},doneText:{fontWeight:"800",color:colors.ink}});
