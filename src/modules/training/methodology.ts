import type{Experience,ExerciseRole,Goal}from"./types";
export const TRAINING_ENGINE_VERSION="1.0.0";export const TRAINING_RULESET_VERSION="2026.08-v1";
export const methodology={
 weeks:4,
 session:{exerciseMinutes:{primary:11,secondary:8,accessory:5}as Record<ExerciseRole,number>,bufferMinutes:5 as number},
 sets:{new:{primary:2,secondary:2,accessory:1},beginner:{primary:3,secondary:2,accessory:2},intermediate:{primary:3,secondary:3,accessory:2},advanced:{primary:4,secondary:3,accessory:3}}as Record<Experience,Record<ExerciseRole,number>>,
 rir:{new:3,beginner:3,intermediate:2,advanced:2}as Record<Experience,number>,
 rest:{primary:150,secondary:120,accessory:75}as Record<ExerciseRole,number>,
 goalRepRanges:{build_strength:{primary:[3,6],secondary:[6,10],accessory:[10,15]},build_muscle:{primary:[6,10],secondary:[8,12],accessory:[10,20]},lose_fat:{primary:[6,10],secondary:[8,12],accessory:[10,15]},general_fitness:{primary:[6,10],secondary:[8,12],accessory:[10,15]},endurance:{primary:[8,12],secondary:[10,15],accessory:[12,20]}}as Record<Goal,Record<ExerciseRole,[number,number]>>,
 weeklySetBounds:{new:[4,10],beginner:[6,12],intermediate:[8,16],advanced:[10,18]}as Record<Experience,[number,number]>
}as const;
export type Methodology=typeof methodology;
