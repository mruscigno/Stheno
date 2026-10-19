# Analytics and privacy

App 2 defines a minimal allowlist: app opened, assessment entry viewed, existing-member sign-in clicked, login success/failure, reset requested, auth verified, session expired, and sign-out.

Permitted properties are route, broad non-sensitive failure category, and environment. The interface cannot accept email, password, tokens, assessment answers, body metrics, free text, or raw error objects. No analytics transport is installed by default; events are safely inert until an approved provider adapter is added.
