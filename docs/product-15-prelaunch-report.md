# Product 15 pre-launch report

## Legal

- `/terms`, `/privacy`, and `/medical-disclaimer` are implemented and linked globally.
- Signup uses an unselected required acknowledgment and stores document type, version, timestamp, and source.
- No attorney-review, HIPAA, governing-law, jurisdiction, or arbitration claim is made.
- **Owner blocker:** qualified counsel must review the documents and decide governing-law, jurisdiction, arbitration, liability, warranty, and final refund language before paid public launch.

## Exercise library

- Public and API queries require prescribable, indexable, technical, editorial, and visual review gates.
- The initial 20 currently prescribed movements are the first reviewed launch batch.
- Remaining catalog records are not prescribable or indexable until reviewed in batches.
- Substitutions require overlapping primary muscles and the same programming role.
- Customer pages no longer display movement taxonomy as descriptive copy.
- Media generation is offline, draft-first, schema-controlled, and cannot auto-publish.
- Coverage is available from the private `exercise_readiness_coverage` view.

## Analytics

- Explicit events cover landing, CTA, assessment steps/abandonment/completion, Blueprint generation/view, signup, verification, trial, checkout, subscription lifecycle, renewals, failures, and past-due states.
- Raw assessment answers, safety/medical responses, Coach messages, and free text are never included in event properties.
- PostHog uses anonymous persistence and merges to stable Supabase user IDs on authentication.
- Stripe webhook receipts prevent duplicate paid-conversion processing.
- **Owner blocker:** PostHog keys are not configured in Vercel. Add `NEXT_PUBLIC_POSTHOG_KEY` and, if not using US Cloud, `NEXT_PUBLIC_POSTHOG_HOST`; then create the dashboard from `ops/posthog/product-15-dashboard.json`.

## Launch status

Not launch-ready until legal counsel review is complete, PostHog is configured and live events/dashboard are verified, and required exercise-library batches achieve approved content/media coverage.

