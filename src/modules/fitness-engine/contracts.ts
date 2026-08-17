import{z}from"zod";
export const ENGINE_VERSION="1.0.0";export const RULESET_VERSION="2026.08-v1";
export const SafetyClassification=z.enum(["normal","caution","modify","stop","refer"]);export type SafetyClassification=z.infer<typeof SafetyClassification>;
export const SafetyResult=z.object({classification:SafetyClassification,reasonCodes:z.array(z.string().min(1)),evaluatedAt:z.iso.datetime(),engineVersion:z.string(),rulesetVersion:z.string()});
export const EngineDecision=z.object({decisionId:z.uuid(),decisionType:z.enum(["assessment","goal","training","progression","nutrition","recovery","adherence","trajectory","safety"]),reasonCode:z.string().min(1),inputs:z.record(z.string(),z.unknown()),priorState:z.record(z.string(),z.unknown()).nullable(),newState:z.record(z.string(),z.unknown()).nullable(),engineVersion:z.string(),rulesetVersion:z.string(),decidedAt:z.iso.datetime(),safety:SafetyResult});export type EngineDecision=z.infer<typeof EngineDecision>;
export interface FitnessEngine<I,O>{readonly domain:EngineDecision["decisionType"];evaluate(input:I):Promise<{output:O;decision:EngineDecision}>}
