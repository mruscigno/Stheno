# Monthly scheduler verification

`runMonthlyReviewScheduler` remains the single scheduler. It uses the existing `member_review_state.next_monthly_review_at`, creates one review per `(user_id,due_at)`, marks it due, and sends idempotent due/follow-up mail. App 6C does not create another cron, clock, or state table.
