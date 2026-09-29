import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  completeExerciseGuide,
  reviewedGuidanceProvenance,
  type ExerciseEducation,
  type GuidanceProvenance,
} from "@/modules/training/guide-content";
import type { Equipment, Exercise, ExerciseRole, Experience, MovementPattern, Muscle } from "@/modules/training/types";

const releaseGate = {
  status: "production",
  review_status: "reviewed",
  production_ready: true,
  technical_review_status: "reviewed",
  editorial_review_status: "reviewed",
  visual_review_status: "reviewed",
};

export const canonicalExerciseSelect = "id,slug,name,purpose,family,exercise_type,movement_type,prescription_unit,movement_pattern,exercise_role,primary_muscles,secondary_muscles,required_equipment,skill_level,fatigue_cost,progression_suitability,rep_min,rep_max,duration_min_seconds,duration_max_seconds,distance_min,distance_max,distance_unit,interval_work_seconds,interval_recovery_seconds,interval_rounds_min,interval_rounds_max,education,caution_tags,media_provenance,content_version,license_key,review_status,production_ready,laterality,content_reviewed,quality_validated_at,guidance_provenance,reviewed_at,review_source";

export type CanonicalExercise = {
  id:string; slug:string; name:string; purpose:string; family:string; exercise_type:string;
  movement_type:string; prescription_unit:string; movement_pattern:string; exercise_role:string;
  primary_muscles:string[]; secondary_muscles:string[]; required_equipment:string[];
  skill_level:string; fatigue_cost:number; progression_suitability:number; rep_min:number|null; rep_max:number|null;
  duration_min_seconds:number|null; duration_max_seconds:number|null; distance_min:number|null; distance_max:number|null;
  distance_unit:string|null; interval_work_seconds:number|null; interval_recovery_seconds:number|null;
  interval_rounds_min:number|null; interval_rounds_max:number|null; education:Required<ExerciseEducation>;
  caution_tags:string[]; media_provenance:unknown; content_version:string; license_key:string;
  review_status:string; production_ready:boolean; laterality:string; content_reviewed:boolean;
  quality_validated_at:string|null; guidance_provenance:GuidanceProvenance; reviewed_at:string|null; review_source:string;
};

function canonicalize(row: Record<string, unknown>): CanonicalExercise {
  const education = completeExerciseGuide({
    name:String(row.name), movementPattern:String(row.movement_pattern),
    primaryMuscles:(row.primary_muscles as string[]) ?? [], equipment:(row.required_equipment as string[]) ?? [],
    education:row.education as ExerciseEducation, productionReady:true,
  });
  return {...row, education, guidance_provenance:(row.guidance_provenance as GuidanceProvenance) ?? reviewedGuidanceProvenance()} as CanonicalExercise;
}

export async function getCanonicalExercise(slug:string, client?:SupabaseClient) {
  const db=client ?? await createSupabaseServerClient();
  if(!db) return null;
  const {data,error}=await db.from("exercises").select(canonicalExerciseSelect).match(releaseGate).eq("slug",slug).maybeSingle();
  if(error) throw new Error(`CANONICAL_EXERCISE_QUERY_FAILED:${error.message}`);
  return data ? canonicalize(data as Record<string,unknown>) : null;
}

export async function listCanonicalExercises(client?:SupabaseClient) {
  const db=client ?? await createSupabaseServerClient();
  if(!db) return [];
  const {data,error}=await db.from("exercises").select(canonicalExerciseSelect).match(releaseGate).order("name").limit(1000);
  if(error) throw new Error(`CANONICAL_EXERCISE_QUERY_FAILED:${error.message}`);
  return (data ?? []).map(row=>canonicalize(row as Record<string,unknown>));
}

const allowedPatterns=new Set<MovementPattern>(["squat","hinge","horizontal_push","vertical_push","horizontal_pull","vertical_pull","lunge","isolation","carry"]);
const allowedRoles=new Set<ExerciseRole>(["primary","secondary","accessory"]);
const allowedEquipment=new Set<Equipment>(["barbell","dumbbells","machines","cables","bench","bands","bodyweight"]);
const allowedMuscles=new Set<Muscle>(["quadriceps","hamstrings","glutes","chest","back","shoulders","biceps","triceps","calves","core"]);
const allowedSkills=new Set<Experience>(["new","beginner","intermediate","advanced"]);

export function canonicalExerciseToTrainingExercise(row:CanonicalExercise):Exercise|null {
  if(!allowedPatterns.has(row.movement_pattern as MovementPattern)||!allowedRoles.has(row.exercise_role as ExerciseRole)) return null;
  const equipment=row.required_equipment.filter((x):x is Equipment=>allowedEquipment.has(x as Equipment));
  const primary=row.primary_muscles.filter((x):x is Muscle=>allowedMuscles.has(x as Muscle));
  if(!equipment.length||!primary.length) return null;
  return {slug:row.slug,name:row.name,family:row.family,pattern:row.movement_pattern as MovementPattern,role:row.exercise_role as ExerciseRole,
    primaryMuscles:primary,secondaryMuscles:row.secondary_muscles.filter((x):x is Muscle=>allowedMuscles.has(x as Muscle)),requiredEquipment:equipment,
    skill:allowedSkills.has(row.skill_level as Experience)?row.skill_level as Experience:"beginner",fatigueCost:Math.min(5,Math.max(1,row.fatigue_cost||2)) as Exercise["fatigueCost"],
    setupMinutes:row.exercise_role==="primary"?3:2,repRange:[row.rep_min??5,row.rep_max??15],progressionSuitability:Math.min(5,Math.max(1,row.progression_suitability||3)) as Exercise["progressionSuitability"],
    unilateral:row.laterality==="unilateral",instructions:[...row.education.setup,...row.education.execution],cues:row.education.cues,mistakes:row.education.mistakes,
    cautionTags:row.caution_tags,reviewStatus:"reviewed",contentVersion:row.content_version,license:"STHENO_ORIGINAL"};
}

export async function loadCanonicalTrainingLibrary(client?:SupabaseClient) {
  return (await listCanonicalExercises(client)).map(canonicalExerciseToTrainingExercise).filter((x):x is Exercise=>Boolean(x));
}
