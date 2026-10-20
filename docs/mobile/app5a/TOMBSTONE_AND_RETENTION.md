# Tombstones and retention

Deleted sets retain `deleted_at`, their canonical ID, and revision so delayed offline writes cannot silently resurrect them. Receipts default to 180-day retention, which exceeds supported offline retry windows; cleanup must never remove a receipt while a supported client could replay it. Outbox rows remain until processing is confirmed and may then be archived under an operational policy.
