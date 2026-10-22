# Migration and rollback

Migration: `20261022152155_app6c_monthly_progress_atomicity.sql`.

Forward changes are additive: revision/update timestamps, photo consent/status fields, a decision receipt table, and one transaction RPC. Before production migration, the isolated Supabase workflow must pass.

Rollback order: keep the feature flag off; remove execute permission and drop the RPC; drop `monthly_review_decisions`; optionally remove the additive columns after confirming no App 6C data depends on them. Existing Product 19 tables and photos must not be dropped.
