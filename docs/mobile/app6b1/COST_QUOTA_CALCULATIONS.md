# Cost and quota calculations

The conservative preflight estimate is 40,000 input plus 2,000 output tokens: `(40,000 × $0.10 + 2,000 × $0.50) / 1,000,000 = $0.005` maximum estimated provider cost per review. The worker records actual usage and calculated cost.

Processing requires all three controls: `FORM_REVIEW_BUDGET_KILL_SWITCH=open`, a positive `FORM_REVIEW_MAX_COST_USD` covering the estimate, and a positive `FORM_REVIEW_MONTHLY_BUDGET_USD` with remaining capacity. Defaults are zero/closed. A transaction-level advisory lock enforces four eligible reviews per user per UTC month; deleted, failed, and expired attempts do not consume quota.

