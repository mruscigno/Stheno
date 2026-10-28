# Open blockers

1. Run `40773117612` was blocked before the product path by dropped API 35 numeric input. The harness now uses individually verified text injection.
2. Run `40775685168` confirmed the generated API 35 app could not reach the workflow's local HTTP API or Supabase services. The apparent 401/404/409 requests were deliberate backend negative tests, not app traffic. Non-production builds now permit the isolated host-forwarded HTTP transport while production remains HTTPS-only. A fresh current-commit Android CI run must complete the full offline recovery/replay/completion journey and upload genuine evidence.
3. Native duplicate retry, timeout-after-commit, stale-revision preservation and A/B account isolation require runtime evidence.
4. iOS runtime validation remains pending and is not claimed.

No user action is currently required. Production activation remains off.
