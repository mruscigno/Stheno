# Security model

- Every user-private Product 1 table has explicit `user_id` ownership and RLS for select, insert, update, and delete.
- Policies use `(select auth.uid()) = user_id` and update policies include both `using` and `with check`.
- Public knowledge tables are read-only to `anon` and `authenticated`; no public write policy exists.
- `handle_new_user` is the only security-definer function. It has an empty search path and execute is revoked from application roles.
- Browser code receives only the Supabase publishable key. Secret/service keys remain server-only.
- Sentry disables default PII; analytics payloads are typed and must not contain sensitive free text.
- `supabase/tests/rls_isolation.sql` verifies cross-user read/update isolation when run with pgTAP in a disposable environment.
