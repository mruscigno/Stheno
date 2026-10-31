# Security and privacy report

- Bearer/cookie identity and paid/trial access remain mandatory.
- Native mutations require the independent rollout decision.
- RLS is enabled on both new rollout tables; no anonymous grants exist.
- Members cannot self-enroll or alter rollout state.
- Workout ownership, revisions, receipts and idempotency remain database-enforced.
- Sign-out/account switching keeps existing owner-scoped SQLite cleanup and selection behavior.
- Logs contain aggregate counts, latency and error codes only; no tokens, photo paths, workout payloads or member identifiers are logged.
- No service-role secret is added to the native bundle.

Existing Supabase advisor warnings outside this narrow release remain open: authenticated execution of two reviewed `SECURITY DEFINER` RPCs and disabled leaked-password protection. References: [database linter](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
