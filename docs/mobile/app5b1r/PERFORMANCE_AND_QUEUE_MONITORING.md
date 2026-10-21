# Performance and queue monitoring

Monitor pending count, oldest pending age, processing leases past expiry, retry rate, dead-letter count, attempts by event type, worker duration, and duplicate-key/error rate. The worker caps each claim at 20 in application code and 50 in SQL, uses a four-minute budget, and preserves ordering per session while allowing parallel sessions.

Operational thresholds:

- investigate any dead-letter event;
- investigate expired leases remaining after the next scheduler run;
- alert when oldest pending age exceeds 26 hours under the daily recovery schedule;
- manually drain after an outage or before a release using the protected endpoint.

Production latency and throughput are not claimed until live activation evidence exists.
