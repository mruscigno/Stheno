export const membership = { trialDays: 14, monthly: { amount: 14.99, label: "$14.99", interval: "month" }, annual: { amount: 119, label: "$119", interval: "year" } } as const;
export const annualSavings = Number((membership.monthly.amount * 12 - membership.annual.amount).toFixed(2));
