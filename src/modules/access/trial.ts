export const TRIAL_DAYS=14;
const PAID_STATUSES=new Set(["active"]);
export type AccessState="trial"|"paid"|"expired";
export function evaluateMemberAccess({accountCreatedAt,subscriptionStatus,now=new Date()}:{accountCreatedAt:string;subscriptionStatus?:string|null;now?:Date}){
  const createdAt=new Date(accountCreatedAt),trialEndsAt=new Date(createdAt.getTime()+TRIAL_DAYS*24*60*60*1000),paid=PAID_STATUSES.has(subscriptionStatus??""),trialActive=now.getTime()<trialEndsAt.getTime(),state:AccessState=paid?"paid":trialActive?"trial":"expired",millisecondsRemaining=Math.max(0,trialEndsAt.getTime()-now.getTime());
  return{hasAccess:paid||trialActive,state,trialEndsAt:trialEndsAt.toISOString(),daysRemaining:trialActive?Math.max(1,Math.ceil(millisecondsRemaining/(24*60*60*1000))):0};
}
