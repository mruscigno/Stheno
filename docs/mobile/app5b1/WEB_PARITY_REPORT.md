# Web parity report

The existing workout page and `/api/workouts/today` contract remain available. The adapter returns its established `saved`, `set`, PR, workload, achievement, workout, and summary fields plus operation ID, authoritative revision, and replay state. Cookie authentication remains unchanged. The public design, assessment, Blueprint, Nutrition, Coach, Progress, Stripe, reviews, and exercise content are untouched.

Short-time and general “adjust today” mutations now use the same receipt/revision transaction boundary through the adaptation operation. Existing decision records remain idempotent via their operation key.
