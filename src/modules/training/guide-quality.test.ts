import {describe,expect,it} from "vitest";
import {getSubstitutions} from "./adapt";
import {completeExerciseGuide,guideCompletenessErrors,humanizeExerciseText} from "./guide-content";
import {productionExerciseLibrary} from "./exercises";
import type {TrainingProfile} from "./types";

const profile:TrainingProfile={profileId:"p",assessmentId:"a",goal:"build_muscle",experience:"intermediate",daysPerWeek:3,sessionMinutes:60,equipment:["barbell","dumbbells","machines","cables","bench","bands","bodyweight"],avoidances:[],preferences:[],safetyClassification:"normal"};

describe("exercise guide quality gate",()=>{
  it("never exposes stored enum identifiers in reader-facing prose",()=>{expect(humanizeExerciseText("Perform the horizontal_push pattern with the rear_delts under control.")).toBe("Perform the horizontal push pattern with the rear delts under control.");const guide=completeExerciseGuide({name:"Bench Press",movementPattern:"horizontal_push",primaryMuscles:["chest"],equipment:["dumbbells"],education:{setup:["Use the incline_bench.","Set up.","Brace."],execution:["Perform the horizontal_push pattern.","Lower.","Press.","Reset."],cues:["Use rear_delts.","Control.","Breathe."],mistakes:["Avoid joint_focused pain.","Do not rush.","Stay stable."],feel:"Chest, not joint_focused pressure.",stopModify:"Stop for joint_focused pain."}});expect(JSON.stringify(guide)).not.toMatch(/[a-z]_[a-z]/)});
  it("turns weak stored education into a complete beginner guide",()=>{const guide=completeExerciseGuide({name:"Seated Cable Row",movementPattern:"horizontal_pull",primaryMuscles:["back"],equipment:["cables"],education:{setup:["Sit down."],execution:["Pull."],cues:["Control it."],mistakes:["Do not rush."]}});expect(guideCompletenessErrors(guide)).toEqual([]);expect(guide.setup.join(" ")).toMatch(/cable|seat/i);expect(guide.execution.join(" ")).toMatch(/elbows|ribs/i);expect(guide.feel).toMatch(/back/i)});
  it("hard excludes primary-muscle mismatches from every substitution",()=>{for(const original of productionExerciseLibrary){for(const candidate of getSubstitutions(original.slug,profile)){expect(candidate.exercise.primaryMuscles.some(m=>original.primaryMuscles.includes(m))).toBe(true)}}});
  it("never offers curls or lateral raises for a triceps pressdown",()=>{const slugs=getSubstitutions("cable-triceps-pressdown",profile).map(x=>x.exercise.slug);expect(slugs).not.toContain("dumbbell-curl");expect(slugs).not.toContain("lateral-raise")});
  it.each([["cable-row",["back"]],["dumbbell-bench-press",["chest"]],["lateral-raise",["shoulders"]]])("keeps alternatives for %s on its primary muscle",(slug,muscles)=>{expect(getSubstitutions(slug,profile).every(x=>x.exercise.primaryMuscles.some(m=>muscles.includes(m)))).toBe(true)});
});
