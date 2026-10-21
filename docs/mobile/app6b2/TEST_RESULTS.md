# Test results

Evidence collected so far:

- Root TypeScript passed before real evaluation.
- App 6B-1 targeted suite: 2 files / 11 tests passed after model-price changes.
- Real four-frame inference: HTTP 200, structured schema/grounding passed.
- Real one-frame inference: HTTP 200, explicit abstention passed.
- Two FFmpeg preview packaging attempts failed before provider invocation; one 800-token provider response was rejected as invalid.

Final regression and isolated Supabase workflow results are appended after completion. Failed attempts are retained in the budget ledger rather than hidden.

