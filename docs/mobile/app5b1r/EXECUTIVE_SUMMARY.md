# App 5B-1R executive summary

This sprint replaces the unsafe blanket migration path with three explicitly reviewed workout migrations and adds a durable worker over the existing transactional outbox. Production evidence proves the App 5A/5B-1 objects are absent, rather than merely recorded under different timestamps. The worker uses leases, `FOR UPDATE SKIP LOCKED`, per-session ordering, bounded retry, dead-lettering, re-drive, and idempotent derived calculations.

The worker reuses the existing authenticated Vercel cron runtime, so it adds no paid service. Synchronous derived calculations remain the immediate path; the outbox is the durable recovery path. Weekly workload now recomputes from source-of-truth completed sessions, preventing double counting when both paths run.
