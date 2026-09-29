import {describe,expect,it} from "vitest";
import {formatExercisePrescription} from "./prescription";

describe("exercise prescription semantics",()=>{
  it("renders Forearm Plank as time rather than repetitions",()=>expect(formatExercisePrescription({movement_type:"TIMED_ISOMETRIC",duration_min_seconds:20,duration_max_seconds:60})).toBe("20–60 seconds"));
  it("renders carries with distance units",()=>expect(formatExercisePrescription({movement_type:"LOADED_CARRY_DISTANCE",distance_min:20,distance_max:60,distance_unit:"yd"})).toBe("20–60 yd"));
  it("renders cardio intervals with work, recovery and rounds",()=>expect(formatExercisePrescription({movement_type:"CARDIO_INTERVAL",interval_work_seconds:20,interval_recovery_seconds:40,interval_rounds_min:4,interval_rounds_max:10})).toBe("20s work / 40s recovery · 4–10 rounds"));
  it("preserves dynamic repetition ranges",()=>expect(formatExercisePrescription({movement_type:"DYNAMIC_REPS",rep_min:8,rep_max:12})).toBe("8–12 reps"));
});
