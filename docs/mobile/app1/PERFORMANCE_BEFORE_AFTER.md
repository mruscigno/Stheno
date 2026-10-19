# Performance Before / After

## Build comparison

| Measurement | Baseline | Final | Interpretation |
|---|---:|---:|---|
| Test files / tests | 50 / 208 | See `TEST_RESULTS.md` | App 1 adds focused platform tests |
| Next compile | 21.9s | See `TEST_RESULTS.md` | Compare on same workstation |
| Next TypeScript phase | 24.1s | See `TEST_RESULTS.md` | Compare on same workstation |
| Static pages | 140 | See `TEST_RESULTS.md` | Public page count should not regress |

## Runtime design

- Public exercise listing uses cursor pagination and a maximum page size of 100 instead of returning all 330 records.
- Authenticated read models execute independent owner-scoped queries concurrently.
- All personalized API responses are `no-store` to avoid cross-user cache risk.
- Bearer authentication adds one authoritative Supabase `getUser` call and protected feature authorization adds one active-subscription lookup.
- The API adds no new homepage/pricing queries or client JavaScript, so homepage/pricing TTFB and bundle behavior should be unchanged.

Representative production latency measurement needs an authenticated synthetic test identity and is deferred rather than using customer data. Deployment smoke timings should be captured after the schema is migrated and production deployment is live.
