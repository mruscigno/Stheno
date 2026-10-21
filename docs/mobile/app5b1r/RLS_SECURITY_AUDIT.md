# RLS and security audit

- Outbox and receipts keep RLS enabled and direct member outbox privileges revoked.
- Worker RPCs require a service-role JWT inside the function and grant execute only to `service_role`.
- Effect receipts live in the unexposed `private` schema.
- Privileged functions use an empty `search_path` and schema-qualified objects.
- `anon` and `authenticated` cannot claim, acknowledge, fail, or re-drive events.
- The member receipt endpoint remains owner-filtered by `auth.uid()`.
- The worker uses the server-only Supabase secret and `CRON_SECRET`; neither is exposed to client bundles.
