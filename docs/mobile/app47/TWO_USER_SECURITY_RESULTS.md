# Two-user security results

## Passed

The isolated suite contains 24 pgTAP assertions and a real concurrent A/B claim race.

- User A reads only A's profile, program, workout sessions, reviews, and private progress-photo metadata.
- User B cannot read A's program or progress-photo metadata.
- User A cannot update/delete B's protected records.
- Anonymous callers cannot read private profile/program data or invoke the claim RPC.
- Tampered, expired, missing-role, and mismatched-claimant attempts are denied.
- A valid owner claim creates one assessment.
- A same-owner retry is idempotent.
- A client cannot grant itself a paid entitlement.
- Cross-user idempotency receipts are not readable.
- A real concurrent A/B race produces one winner and rejects the loser with `already_claimed_by_another_account`.

## Scope note

Optimistic assessment revision conflicts are enforced in the application API rather than by the claim RPC and are not represented as a database-only pgTAP assertion in this lane. No claim is made that the full native/API revision-mismatch path was exercised.

