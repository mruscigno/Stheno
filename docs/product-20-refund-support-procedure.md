# Product 20 refund support procedure

The customer-facing policy is in `/terms`. The supported self-service path is **Account → Review 30-day guarantee eligibility**.

If automatic subscription cancellation reports a partial failure after Stripe has already issued the refund:

1. Find the `refund_requests` row using the member ID or Stripe charge ID.
2. Confirm the recorded `stripe_refund_id` in Stripe before taking any payment action. Never issue a second refund without that check.
3. Cancel the linked subscription in Stripe and confirm its status is canceled.
4. Confirm the member's premium entitlement is disabled.
5. Update the local subscription status to canceled and record the support resolution in the request's failure context.
6. Tell the member that the refund was already issued and cancellation is complete. Do not promise the bank settlement date; Stripe and the issuing bank control it.

Requests outside the self-service eligibility window should be reviewed through the contact queue. Do not override eligibility without an authorized business decision, and do not imply that this policy limits non-waivable consumer rights.
