# Retention and deletion tests

Implemented:

- accelerated expiry through an explicit `evaluation_now` test clock;
- service-role-only claim of expired reviews;
- cleanup leases and `FOR UPDATE SKIP LOCKED` to prevent double claims;
- storage deletion before database tombstoning;
- exponential retry scheduling when storage deletion fails;
- clearing structured output and member question on deletion;
- consent-revocation timestamp for member-requested deletion;
- fail-closed API response if physical deletion fails;
- deleted rows cannot be reclaimed.

The application stores no derived frames or thumbnails; FFmpeg frames exist only in an OS temporary directory that is recursively removed in a `finally` block.

This is accelerated simulation, not 30 elapsed days. After any later pilot activation, monitoring must alert on overdue non-deleted rows, cleanup failures, oldest retry age, and storage/database mismatches. A real 30-day observation remains a release-evidence blocker.
