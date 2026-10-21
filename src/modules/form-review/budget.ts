export const FORM_REVIEW_MODEL = process.env.FORM_REVIEW_MODEL ?? "gpt-6-luna";
export const FORM_REVIEW_INPUT_USD_PER_MILLION = 0.1;
export const FORM_REVIEW_OUTPUT_USD_PER_MILLION = 0.5;
export const FORM_REVIEW_ESTIMATED_MAX_INPUT_TOKENS = 40_000;
export const FORM_REVIEW_ESTIMATED_MAX_OUTPUT_TOKENS = 2_000;

export function estimateReviewCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * FORM_REVIEW_INPUT_USD_PER_MILLION + outputTokens * FORM_REVIEW_OUTPUT_USD_PER_MILLION) / 1_000_000;
}

export function readBudgetConfig() {
  const perReviewCap = Number(process.env.FORM_REVIEW_MAX_COST_USD ?? "0");
  const monthlyGlobalCap = Number(process.env.FORM_REVIEW_MONTHLY_BUDGET_USD ?? "0");
  return {
    killSwitchOpen: process.env.FORM_REVIEW_BUDGET_KILL_SWITCH === "open",
    perReviewCap: Number.isFinite(perReviewCap) ? Math.max(0, perReviewCap) : 0,
    monthlyGlobalCap: Number.isFinite(monthlyGlobalCap) ? Math.max(0, monthlyGlobalCap) : 0,
    estimatedMaximum: estimateReviewCost(FORM_REVIEW_ESTIMATED_MAX_INPUT_TOKENS, FORM_REVIEW_ESTIMATED_MAX_OUTPUT_TOKENS),
  };
}

export function budgetAllowsReview(monthlySpend: number) {
  const config = readBudgetConfig();
  if (!config.killSwitchOpen || config.perReviewCap <= 0 || config.monthlyGlobalCap <= 0) return false;
  return config.estimatedMaximum <= config.perReviewCap && monthlySpend + config.estimatedMaximum <= config.monthlyGlobalCap;
}

