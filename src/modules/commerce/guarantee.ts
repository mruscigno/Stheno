export const MONEY_BACK_GUARANTEE_DAYS = 30;

export function evaluateGuarantee(firstPaidAt: Date, now = new Date()) {
  const deadline = new Date(firstPaidAt);
  deadline.setUTCDate(deadline.getUTCDate() + MONEY_BACK_GUARANTEE_DAYS);
  return { eligible: now <= deadline, deadline };
}
