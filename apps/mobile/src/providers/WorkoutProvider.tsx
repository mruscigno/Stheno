import * as Network from "expo-network";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useAuth } from "./AuthProvider";
import { adoptServerWorkout, completeLocalWorkout, createLocalWorkout, getLocalWorkout, saveLocalSet, setRestDeadline, substituteLocalExercise, syncWorkoutOutbox, type LocalWorkout, type LocalWorkoutSet } from "../lib/workout-store";

type WorkoutContextValue={workout:LocalWorkout|null;loading:boolean;online:boolean;start:(workoutKey:string,workout:Record<string,unknown>)=>Promise<void>;saveSet:(set:Omit<LocalWorkoutSet,"syncState">)=>Promise<void>;substitute:(exerciseSlug:string,replacementSlug:string,replacementName:string)=>Promise<void>;complete:(effort:"too_easy"|"about_right"|"very_hard"|"couldnt_finish",allowIncomplete:boolean)=>Promise<void>;startRest:(seconds:number)=>Promise<void>;refresh:()=>Promise<void>;sync:()=>Promise<void>};
const WorkoutContext=createContext<WorkoutContextValue|null>(null);

export function WorkoutProvider({children}:PropsWithChildren){
  const auth=useAuth(),userId=auth.session?.user.id??null,[workout,setWorkout]=useState<LocalWorkout|null>(null),[loading,setLoading]=useState(false),[online,setOnline]=useState(true);
  const refresh=useCallback(async()=>{if(!userId){setWorkout(null);return;}setWorkout(await getLocalWorkout(userId));},[userId]);
  const sync=useCallback(async()=>{if(!userId)return;await syncWorkoutOutbox(userId);await refresh();},[refresh,userId]);
  useEffect(()=>{let active=true;if(!userId){void Promise.resolve().then(()=>{if(active)setWorkout(null);});return()=>{active=false;};}void getLocalWorkout(userId).then(value=>{if(active)setWorkout(value);});return()=>{active=false;};},[userId]);
  useEffect(()=>{const subscription=Network.addNetworkStateListener(state=>{const connected=state.isConnected!==false;setOnline(connected);if(connected)void sync();});return()=>subscription.remove();},[sync]);
  useEffect(()=>{if(!userId||workout||!auth.today?.activeWorkout)return;void adoptServerWorkout(userId,auth.today.activeWorkout).then(()=>refresh());},[auth.today?.activeWorkout,refresh,userId,workout]);
  const start=useCallback(async(workoutKey:string,nextWorkout:Record<string,unknown>)=>{if(!userId)return;setLoading(true);try{await createLocalWorkout(userId,workoutKey,nextWorkout);await refresh();void sync();}finally{setLoading(false);}},[refresh,sync,userId]);
  const saveSet=useCallback(async(set:Omit<LocalWorkoutSet,"syncState">)=>{if(!userId||!workout)return;await saveLocalSet(userId,workout.localSessionKey,set);await refresh();void sync();},[refresh,sync,userId,workout]);
  const complete=useCallback(async(effort:"too_easy"|"about_right"|"very_hard"|"couldnt_finish",allowIncomplete:boolean)=>{if(!userId||!workout)return;await completeLocalWorkout(userId,workout.localSessionKey,effort,allowIncomplete);await refresh();await sync();},[refresh,sync,userId,workout]);
  const substitute=useCallback(async(exerciseSlug:string,replacementSlug:string,replacementName:string)=>{if(!userId||!workout)return;await substituteLocalExercise(userId,workout.localSessionKey,exerciseSlug,replacementSlug,replacementName);await refresh();void sync();},[refresh,sync,userId,workout]);
  const startRest=useCallback(async(seconds:number)=>{if(!userId||!workout)return;await setRestDeadline(userId,workout.localSessionKey,new Date(Date.now()+seconds*1000).toISOString());await refresh();},[refresh,userId,workout]);
  const value=useMemo(()=>({workout,loading,online,start,saveSet,substitute,complete,startRest,refresh,sync}),[complete,loading,online,refresh,saveSet,start,startRest,substitute,sync,workout]);
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}
export function useWorkout(){const value=useContext(WorkoutContext);if(!value)throw new Error("useWorkout must be inside WorkoutProvider");return value;}
