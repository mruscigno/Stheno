import type{SafetyClassification}from"@/modules/fitness-engine/contracts";
export const SAFETY_SCREENING_VERSION="1.0.0";
const stopPatterns=[/chest pain/i,/faint(?:ed|ing)?/i,/severe shortness of breath/i,/cannot breathe/i];
const referPatterns=[/numb(?:ness)?/i,/loss of (?:balance|feeling)/i,/doctor|physician|physical therapist|clinician/i,/pregnan|postpartum/i,/eating disorder/i];
const modifyPatterns=[/pain|hurt|injur|discomfort|cannot|can't|avoid/i];
export function screenSafety(text:string):{classification:SafetyClassification;reasonCodes:string[]}{
 if(stopPatterns.some(p=>p.test(text)))return{classification:"stop",reasonCodes:["POTENTIAL_URGENT_SYMPTOM"]};
 if(referPatterns.some(p=>p.test(text)))return{classification:"refer",reasonCodes:["PROFESSIONAL_CONTEXT_REPORTED"]};
 if(modifyPatterns.some(p=>p.test(text)))return{classification:"modify",reasonCodes:["USER_REPORTED_MOVEMENT_OR_PAIN_CONSTRAINT"]};
 return{classification:"normal",reasonCodes:[]};
}
