import{screenSafety}from"./safety";
export const INTERPRETER_VERSION="bounded-rules-1.0.0";
export type ContextCandidate={type:string;value:{summary:string};confidence:number;temporalScope:"one_time"|"date_range"|"current_program"|"persistent"|"unknown";safetyFlag:boolean;confirmationRequired:true};
const rules=[
 {type:"temporary_context",pattern:/travel|hotel|vacation|trip/i,scope:"date_range" as const},
 {type:"schedule_constraint",pattern:/schedule|shift|work hours|only (?:on|after|before)/i,scope:"current_program" as const},
 {type:"equipment_constraint",pattern:/equipment|dumbbell|barbell|machine|band|home gym/i,scope:"current_program" as const},
 {type:"exercise_dislike",pattern:/hate|dislike|prefer not/i,scope:"persistent" as const},
 {type:"movement_limitation",pattern:/pain|hurt|injur|cannot|can't|told not/i,scope:"unknown" as const},
];
export function interpretFreeContext(text:string):ContextCandidate[]{const safety=screenSafety(text);return rules.filter(r=>r.pattern.test(text)).map(r=>({type:r.type,value:{summary:text.trim()},confidence:.72,temporalScope:r.scope,safetyFlag:safety.classification!=="normal",confirmationRequired:true as const}));}
