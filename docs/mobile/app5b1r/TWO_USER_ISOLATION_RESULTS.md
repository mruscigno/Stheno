# Two-user isolation results

The App 5A suite retains its two-user mutation and receipt isolation checks. App 5B-1R adds two distinct owners and sessions; authenticated members observe zero outbox rows, while only a service-role worker can claim events. Per-session ordering prevents a later event for one user from blocking the independent head event for another user.
