# Outbox worker implementation

- Runtime: `src/platform/server/workout-outbox.ts` in the existing Vercel Functions deployment.
- Scheduled entry: existing daily `/api/cron/activity-reminders` cron invokes the worker before email work.
- Manual/recovery entry: authenticated `POST /api/cron/workout-outbox` with `CRON_SECRET`.
- Claim: service-role-only `claim_workout_outbox`, `FOR UPDATE SKIP LOCKED`, 1–50 batch, 15–900 second lease.
- Ordering: only the oldest non-final event for a session can be claimed; poison events dead-letter without blocking other users.
- Retry: exponential backoff capped at one hour with deterministic jitter, eight attempts by default.
- Recovery: expired leases are claimable; permanent/expired retries enter `dead_letter`; service-role-only re-drive resets one parked event.
- Privacy: errors are bounded diagnostic codes; payloads, notes, tokens and member records are not logged.
- Delivery: at least once. Observable derived effects are idempotent; worker execution is not described as exactly once.
