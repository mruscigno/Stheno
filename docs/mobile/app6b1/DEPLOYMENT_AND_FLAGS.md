# Deployment and flags

Safe defaults:

- `FORM_REVIEW_PUBLIC_ENABLED=false`
- `FORM_REVIEW_PROCESSING_ENABLED=false`
- `FORM_REVIEW_PILOT_ENABLED=false`
- `FORM_REVIEW_PILOT_PROCESSING_ENABLED=false`
- `FORM_REVIEW_PILOT_USER_IDS=`
- `FORM_REVIEW_BUDGET_KILL_SWITCH=closed`
- `FORM_REVIEW_MAX_COST_USD=0`
- `FORM_REVIEW_MONTHLY_BUDGET_USD=0`
- `EXPO_PUBLIC_FORM_REVIEW_ENABLED=false`

Private pilot requires isolated migration/security success, explicit pilot user IDs, approved per-review/monthly caps, approved spend, a cron schedule, observed quality, and separately enabled pilot UI/processing flags. Public flags remain off until the package's full gate passes.

