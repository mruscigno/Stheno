export type CoachDomain =
  | "training" | "technique" | "programming" | "nutrition" | "supplements"
  | "recovery" | "cardio" | "progress" | "action" | "safety" | "out_of_domain";

const safety = /\b(chest (?:pain|pressure|hurt(?:s|ing)?)|faint(?:ed|ing)?|passed out|can(?:not|'t) breathe|difficulty breathing|severe pain|sharp pain|sudden pain|worsening pain|pain (?:is )?getting worse|eating disorder|starv(?:e|ing)|purg(?:e|ing)|overdose|lose \d+ (?:lb|lbs|pounds|kg|kilos).*(?:weeks?|days?))\b/i;
const action = /\b(change|replace|swap|move|shorten|adapt|travel|rest day|equipment|schedule).*(workout|plan|exercise|week)|\b(shorten|adapt|replace)\b/i;
const groups: Array<[Exclude<CoachDomain, "safety" | "action" | "out_of_domain">, RegExp]> = [
  ["supplements", /\b(creatine|supplement|caffeine|electrolyte|pre[ -]?workout|protein powder|bcaa|vitamin|fish oil)\b/i],
  ["nutrition", /\b(calorie|macro|protein|carb|diet|meal|food|eat|eating|fiber|hydration|water|fat loss|lose weight|weight loss|gain weight|bulk|cutting)\b/i],
  ["recovery", /\b(sleep|recovery|recover|fatigue|tired|sore|soreness|stress|rest day|aching)\b/i],
  ["cardio", /\b(cardio|run(?:ning)?|jog|cycling|bike|steps|zone ?2|aerobic|conditioning|rowing machine|stairmaster|elliptical)\b/i],
  ["progress", /\b(progress|plateau|stronger|strength gain|trend|on track|personal record|pr\b|not growing|not gaining)\b/i],
  ["technique", /\b(form|technique|how (?:do|should) i|cue|mistake|range of motion|rom\b|grip|stance|feel (?:the|my)|target (?:the|my))\b/i],
  ["programming", /\b(volume|frequency|split|sets? per week|days? (?:a|per) week|how many days|five days|5 days|three days|3 days|twice a week|deload|periodization|train .* more|another .* day|failure|rest between sets|rir\b|rpe\b)\b/i],
  ["training", /\b(train(?:ing)?|work ?out|exercise|lift(?:ing)?|gym|strength|hypertrophy|muscle|reps?|sets?|back|lats?|chest|delts?|shoulders?|biceps?|triceps?|arms?|legs?|quads?|hamstrings?|glutes?|calves|abs|core|squat|deadlift|bench press|pull[ -]?up|push[ -]?up)\b/i],
];

export function classifyCoachRequest(text: string): CoachDomain {
  if (safety.test(text)) return "safety";
  if (action.test(text)) return "action";
  for (const [domain, pattern] of groups) if (pattern.test(text)) return domain;
  return "out_of_domain";
}

export function safetyResponse(text: string) {
  if (/\b(chest (?:pain|pressure)|faint(?:ed|ing)?|passed out|can(?:not|'t) breathe|difficulty breathing)\b/i.test(text)) return { classification: "stop", copy: "Stop exercising and seek urgent medical care now. STHENO cannot assess these symptoms." };
  return { classification: "modify", copy: "I can help with a safer training modification, but I can’t diagnose or treat a medical issue. Stop movements that provoke significant symptoms and seek qualified care for severe, sudden, worsening, or persistent symptoms." };
}

export function actionIntent(text: string) {
  const intent = /travel/i.test(text) ? "traveling" : /equipment|gym/i.test(text) ? "different_equipment" : /short/i.test(text) ? "short_on_time" : /rest day/i.test(text) ? "extra_rest_day" : /pain|hurt/i.test(text) ? "pain" : "schedule_changed";
  return { intent, scope: intent === "traveling" || intent === "different_equipment" ? "week" : "session_only" };
}

export const OUT_OF_DOMAIN = "Sorry, I can’t help with that. But if you have a fitness, training, nutrition, supplement, recovery, or STHENO plan question, I’m happy to help.";
export const COACH_SERVICE_ERROR = "Something went wrong while I was answering that. Please try again.";

export function answerQuality(text: string) {
  const banned = ["great question", "fitness is a journey", "everyone is different", "as an ai"];
  return { passes: text.length >= 20 && text.length <= 2200 && !banned.some((phrase) => text.toLowerCase().includes(phrase)), banned: banned.filter((phrase) => text.toLowerCase().includes(phrase)) };
}
