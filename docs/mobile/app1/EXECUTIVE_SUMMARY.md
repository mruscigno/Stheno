# App 1 Executive Summary

App 1 adds a native-safe platform boundary without building mobile UI or changing the public website. The implementation introduces versioned Zod contracts, a typed client foundation, Supabase bearer-token authentication with cookie fallback, shared server read models, public exercise APIs, authenticated member APIs, and replay-aware workout/monthly-review mutations.

The web Coach route now uses the same dual-mode authentication helper, enabling the v1 Coach adapter while preserving cookie sessions. Existing web URLs, UI, Stripe behavior, exercise content, and the 28-day monthly scheduler are unchanged.

A migration adds owner-scoped durable idempotency receipts. It is intentionally additive and contains RLS plus least-privilege grants. Anonymous assessment sessions/claims are deferred: the existing localStorage/full-payload claim architecture needs the App 3 secure anonymous session model defined in App 0; shipping a token shortcut in App 1 would violate the package's security gate.

The 330 canonical exercise slugs retain checksum `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`. All 298 purchased media mappings, 298 MP4s, and 298 posters remain present.

See `FINAL_STATUS.md` for exact test and deployment evidence.
