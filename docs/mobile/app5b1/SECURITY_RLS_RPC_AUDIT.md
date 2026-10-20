# Security, RLS, and RPC audit

- Principal always comes from `auth.uid()` after cookie or bearer verification; no request user ID is accepted.
- Privileged implementation uses `SECURITY DEFINER`, empty `search_path`, and schema-qualified relations.
- Privileged implementation lives in non-exposed `private`.
- Public adapter and receipt lookup use `SECURITY INVOKER`.
- `PUBLIC` and `anon` execute are revoked; `authenticated` receives only explicit execute.
- Receipt table permits owner-only select; outbox has no direct authenticated access.
- Foreign session IDs resolve as not found, preventing ownership disclosure.
