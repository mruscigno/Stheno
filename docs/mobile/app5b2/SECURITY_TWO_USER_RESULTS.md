# Security and two-user results

- Local records and every query are keyed by authenticated `user_id`.
- A user switch cannot read another user’s local workout rows.
- Sign-out warns when owner-scoped operations remain pending; it never silently deletes them.
- Server reads require member authorization and filter by both resource ID and authenticated owner.
- Substitution is accepted only when the server verifies a reviewed canonical alternative.
- Existing isolated two-user RLS/claim and workout atomicity suites remain in the Android gate.
- No privileged Supabase credential or auth token is persisted in the workout database.
