# Data Model

## Existing authoritative groups

- Identity/preferences: `profiles`, `user_preferences`, `consents`.
- Access: `subscriptions`, `subscription_events`, `entitlements`.
- Assessment/personalization: `assessments`, responses/history, profile snapshots.
- Training: `programs`, `program_prescriptions`, exercises/alternatives, decisions.
- Workout: execution sessions, set logs, adaptations, PRs, metrics, workload, achievements.
- Nutrition: targets, activity targets, preferences, entries, summaries, supplements.
- Coaching/reviews: Coach conversations/messages, check-ins, monthly reviews/recommendations, Fitness Memory.
- Photos: private `progress-photos` bucket and owner-scoped metadata/views.

Owner tables use `user_id` and RLS. Public exercise catalog reads remain gated to production/reviewed records. Storage paths use the account UUID prefix.

## App 1 addition

`api_idempotency_records` stores `(user_id, scope, operation_id)` uniquely, SHA-256 payload hash, canonical response, HTTP status, resource revision, completion time, and 90-day expiry. RLS permits authenticated users to select/insert only their own rows; update/delete are not client-granted.

This receipt table supplements rather than replaces existing unique constraints on workout client session keys and set idempotency UUIDs. Cleanup may remove expired receipts only after the maximum supported offline retry window is finalized.

## Scheduled work

The existing activity-reminder Vercel cron and monthly review scheduler remain unchanged. App 1 adds no job and does not alter the actual 28-day review cadence.
