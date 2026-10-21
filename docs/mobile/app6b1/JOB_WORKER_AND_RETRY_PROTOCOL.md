# Job worker and retry protocol

`claim_form_review_jobs` claims up to five due rows with row locking, skip-locked concurrency, a unique lease token, and a 30–600 second lease. Only `service_role` may execute it. Writes require the same review ID, lease token, and `processing` state, so deletion or another claimant wins safely.

Transient timeout, conflict, rate-limit, and 5xx failures retry with exponential backoff, capped at three attempts. Permanent validation, authorization, cost-gate, and grounded-output failures fail closed. The cron route requires `CRON_SECRET`; no production schedule is installed while processing is disabled.

