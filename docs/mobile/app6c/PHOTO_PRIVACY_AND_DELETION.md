# Photo privacy and deletion

Progress photos remain in the private `progress-photos` bucket under an owner-prefixed path. Retrieval uses 15-minute signed URLs. Consent is explicit and versioned as `progress-photos-v1`; scope is fixed to `progress_review_only`. The experience states that photos are optional and excludes marketing and model-training consent.

Set and delete-all operations first remove owned storage objects, then delete owned database rows. Cross-user reads and mutations remain blocked by RLS and path policies.
