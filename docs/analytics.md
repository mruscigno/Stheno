# Analytics taxonomy

Canonical event names live in `src/modules/analytics/events.ts`. Payloads use stable structured properties; sensitive free text is prohibited by default. Events must include environment and preserve acquisition attribution when available. Product 1 live account events are `signup_started` and `signup_completed`; later funnel events are reserved now to avoid naming drift.
