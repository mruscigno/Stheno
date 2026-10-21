# Migration and rollback

Apply in an isolated Supabase project in this order:

1. `20261021170000_app6b_private_form_reviews.sql`
2. `20261021175840_app6b1_form_review_worker.sql`
3. Run `supabase/tests/app6b1_form_review_security.sql` as two test users and service role.

Do not use blind `supabase db push` against production; reconcile the remote migration history first and inspect the schema diff. Rollback is operational first: close all flags and the budget kill switch, stop the worker schedule, retain rows for audit, and delete the private bucket only after retained objects are removed. SQL function/trigger/columns/table rollback must be authored from the verified deployed state.

