# Two-user security results

An executable 13-assertion pgTAP suite is at `supabase/tests/app6b1_form_review_security.sql`. It covers cross-user row access/update/delete, worker RPC privileges, anonymous access, private bucket configuration, size limit, and storage policies.

Result: **not executed against Supabase**. The connector returns permission denied and the linked production project's migration history is divergent, so applying an unverified migration would violate the release gate. No claim of live two-user proof is made; pilot/public activation remains blocked until this suite passes in an isolated project.

