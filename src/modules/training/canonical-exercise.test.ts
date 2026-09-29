import {describe,expect,it} from "vitest";
import {completeExerciseGuide} from "./guide-content";

const reviewed={
  setup:["Use the exact reviewed setup."], execution:["Use the exact reviewed execution.","Finish under control."],
  cues:["Reviewed cue."], mistakes:["Reviewed mistake."], feel:"Reviewed feel.", stopModify:"Reviewed stop guidance.",
};

describe("canonical production exercise guidance",()=>{
  it("preserves every reviewed field exactly regardless of length",()=>{
    expect(completeExerciseGuide({name:"Pistol Squat",movementPattern:"squat",primaryMuscles:["quadriceps"],equipment:["bodyweight"],education:reviewed,productionReady:true})).toEqual(reviewed);
  });
  it("fails closed when a production record is incomplete",()=>{
    expect(()=>completeExerciseGuide({name:"Incomplete",movementPattern:"squat",primaryMuscles:["quadriceps"],equipment:["bodyweight"],education:{setup:["One correct step."]},productionReady:true})).toThrow("PRODUCTION_GUIDANCE_INCOMPLETE");
  });
});
