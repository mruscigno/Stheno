# Baseline and model verification

- Baseline commit: `55f7b6f`.
- Starting production deployment: `dpl_p39L5Na7sz7ZmJnhJzvMp6mYPbpf`.
- Existing implementation: `src/modules/form-review`, `/api/v1/coach/form-reviews/*`, the private `coach-form-videos` bucket, worker cron route, five reviewed rubrics, and App 6B-2 internal budget ledger.
- Production database: App 6B/App 6B-1/App 6B-2 migrations were not applied at baseline.
- Flags at baseline: public, member/pilot, processing, and Expo exposure off.

The OpenAI model catalog was rechecked on 2026-10-21. `gpt-5.4-mini` supports image input, Responses API, and structured output. Current standard token prices remain $0.75 per million input tokens and $4.50 per million output tokens. Account availability was previously established by the successful App 6B-2 calls; App 6B-3 made no provider call.

Authoritative references:

- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.openai.com/api/docs/pricing

Relevant Supabase changes were also checked before implementation. The migration uses explicit grants/revokes, RLS remains enabled, and privileged cleanup functions are restricted to `service_role`.
