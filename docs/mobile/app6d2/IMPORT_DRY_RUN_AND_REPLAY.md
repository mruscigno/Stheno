# Import dry run and replay

`scripts/app6d2/build-import-plan.mjs` produced 52 disabled, idempotent link plans from the visually accepted batch. Replaying the plan into the in-memory key store produced 52 records again—zero duplicate rows.

- Plan: `docs/mobile/app6d2/import-plan.json`
- Plan SHA-256: `79a200e89d5e7066595473d185bcdd353a04e277b6844a8e0c6c64b4dce2a40d`
- Idempotency key: asset ID + canonical slug + role + version.
- Assets: pending.
- Derivatives: unapproved.
- Links: inactive.
- Feature flag: `exercise_media_6d2`.

No database row or storage object was created. The production import remains blocked by migration reconciliation and real database validation, not licensing.
