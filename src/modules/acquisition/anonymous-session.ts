import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { ASSESSMENT_VERSION, type Intake, intakeSteps, visibleSteps } from "./assessment-model";
import type { BlueprintInput } from "./blueprint";

export const ANONYMOUS_SESSION_TTL_DAYS = 30;
export const CAPABILITY_HEADER = "x-stheno-assessment-capability";
export const answerValueSchema = z.union([z.string().max(5000), z.number().finite(), z.array(z.string().max(200)).max(30)]);
export const answersSchema = z.record(z.string().min(1).max(100), answerValueSchema);
export const saveAnonymousAnswersSchema = z.object({ revision: z.number().int().nonnegative(), currentStepKey: z.string().max(100).nullable(), answers: answersSchema });

export function issueCapability() { return randomBytes(32).toString("base64url"); }
export function hashCapability(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }
export function expiresAt(now = new Date()) { return new Date(now.getTime() + ANONYMOUS_SESSION_TTL_DAYS * 86_400_000).toISOString(); }
export function readCapability(request: Request) { const value = request.headers.get(CAPABILITY_HEADER)?.trim(); return value && /^[A-Za-z0-9_-]{40,80}$/.test(value) ? value : null; }

export function validateCompleteIntake(raw: Record<string, unknown>) {
  const parsed = answersSchema.safeParse(raw);
  if (!parsed.success) return { valid: false as const, missing: [], errors: ["Answers are malformed."] };
  const answers = parsed.data as Intake;
  const missing: string[] = [], errors: string[] = [];
  for (const step of visibleSteps(answers)) {
    const value = answers[step.key];
    const blank = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    if (!step.optional && blank) { missing.push(step.key); continue; }
    if (blank) continue;
    if (step.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number) || (step.min !== undefined && number < step.min) || (step.max !== undefined && number > step.max)) errors.push(step.key);
    }
    if (step.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) errors.push(step.key);
    if ((step.type === "single" || step.type === "multi") && step.options) {
      const allowed = new Set(step.options.map((option) => option.value));
      const values = Array.isArray(value) ? value : [String(value)];
      if (values.some((item) => !allowed.has(String(item)))) errors.push(step.key);
    }
  }
  return { valid: missing.length === 0 && errors.length === 0, missing, errors, answers, schemaVersion: ASSESSMENT_VERSION, questionCount: intakeSteps.length } as const;
}

export function toBlueprintInput(answers: Intake): BlueprintInput {
  return {
    goal: answers.goal as BlueprintInput["goal"], secondaryGoal: String(answers.secondaryGoal??""), age:Number(answers.age), sex:answers.sex as BlueprintInput["sex"],
    heightCm:(Number(answers.heightFeet)*12+Number(answers.heightInches))*2.54, weightKg:Number(answers.weightLb)*0.45359237,
    outcome:String(answers.specificOutcome??""), timeframe:String(answers.timeframe??""), experience:answers.experience as BlueprintInput["experience"], currentTraining:String(answers.currentFrequency??""),
    days:Number(answers.days) as BlueprintInput["days"], duration:Number(answers.duration) as BlueprintInput["duration"], schedule:String(answers.schedule??""), location:String(answers.location??""),
    equipment:Array.isArray(answers.equipment)?answers.equipment:[], familiarity:String(answers.familiarity??""), preferences:String(answers.preferences??""), limitations:String(answers.limitations??""),
    cardio:String(answers.currentFrequency??""), activity:String(answers.activity??""), sleep:String(answers.sleep??""), diet:answers.diet as BlueprintInput["diet"], barriers:String(answers.barriers??""), travel:String(answers.travel??""), context:String(answers.context??"")
  };
}

export type AnonymousSessionPublic = { id: string; schemaVersion: string; state: "in_progress"|"finalized"|"claimed"|"expired"; revision: number; currentStepKey: string|null; answers: Intake; blueprint?: unknown; expiresAt: string; claimedAt?: string|null };
