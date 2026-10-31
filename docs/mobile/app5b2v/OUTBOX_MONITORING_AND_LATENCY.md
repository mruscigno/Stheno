# Outbox monitoring and latency

Before App 5B-2V, durable recovery ran as part of the daily 13:00 UTC activity-reminder job, with a protected manual endpoint. The measured live backlog at audit time was empty, so no empirical event latency distribution exists. The worst scheduling delay was nevertheless approximately 24 hours.

App 5B-2V adds a dedicated protected Vercel cron every ten minutes. Each run records only aggregate `pending`, `processing`, `deadLettered`, oldest-pending age, claimed, processed, retried and lease-lost counts.

Abort/alert thresholds for a controlled pilot:

- any dead-letter event;
- oldest pending age above 20 minutes for two checks;
- repeated retry or lease-loss growth;
- mutation 5xx rate above 2% over 15 minutes;
- p95 native mutation latency above 2 seconds over 15 minutes;
- any duplicate receipt or progression side effect.

Recovery: set rollout to `DISABLED`, preserve queued rows and local SQLite, inspect the protected worker logs, fix forward, then re-drive only reviewed dead letters.
