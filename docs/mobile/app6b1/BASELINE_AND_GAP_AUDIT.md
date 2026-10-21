# Baseline and gap audit

App 6B supplied private upload, consent, five App 6A rubrics, owner-scoped APIs, retention, and web/Expo entry points, but processing returned a safe placeholder. App 6B-1 adds bounded decode and frame extraction, strict vision output, a leased worker, retries, cost controls, result rendering, and owner-scoped Coach follow-up.

The App 6B database migration was not present in the production migration history. Its unapplied filename was reconciled to `20261021170000_app6b_private_form_reviews.sql`, followed by `20261021175840_app6b1_form_review_worker.sql`. Production data was not changed because the linked project has migration-history drift and the Supabase connector lacks database permission.

