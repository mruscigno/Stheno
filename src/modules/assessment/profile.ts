import{ASSESSMENT_VERSION}from"./definition";
import{screenSafety}from"./safety";
export const PROFILE_VERSION="1.0.0";
export type AssessmentAnswers=Record<string,string|string[]|number>;
export function buildPersonalizationProfile(answers:AssessmentAnswers){
 const safety=screenSafety([answers.movement_limits,answers.pain_context,answers.free_context].filter(Boolean).join(" "));
 const profile={version:PROFILE_VERSION,assessmentVersion:ASSESSMENT_VERSION,goals:{primary:answers.primary_goal,secondary:answers.secondary_goals??[]},training:{experience:answers.experience,recentConsistency:answers.recent_consistency},availability:{daysPerWeek:Number(answers.days_per_week),preferredDays:answers.preferred_days??[],sessionMinutes:Number(answers.session_minutes)},environment:{location:answers.environment,equipment:answers.equipment??[]},preferences:{enjoy:answers.enjoy??null,dislike:answers.dislike??null},constraints:{movements:answers.movement_limits??null,painContext:answers.pain_context??null},baseline:{heightInches:Number(answers.height),weightLb:Number(answers.weight)},lifestyle:{activity:answers.activity,sleep:answers.sleep},cardio:{current:answers.cardio??null},nutritionContext:{diet:answers.diet??null,trackingComfort:answers.tracking_comfort},goalTimeframe:answers.timeframe??null};
 const provenance=Object.keys(answers).map(key=>({path:key,sourceType:"user_asserted",questionKey:key,assessmentVersion:ASSESSMENT_VERSION,derivedAt:new Date().toISOString()}));
 return{profile,provenance,safety};
}
