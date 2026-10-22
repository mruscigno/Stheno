# Recommendation atomicity

Migration `20261022152155_app6c_monthly_progress_atomicity.sql` adds `apply_monthly_review_decision`. The transaction locks recommendations, validates ownership and bounded action types, applies accepted state, declines the remainder, writes Coach Decisions and Fitness Memory, and stores one durable receipt. A repeated decision returns that receipt and cannot apply a second time.

`supabase/tests/app6c_monthly_progress_security.sql` proves owner isolation, cross-user rejection, one commit, and retry non-duplication in the isolated CI database.
