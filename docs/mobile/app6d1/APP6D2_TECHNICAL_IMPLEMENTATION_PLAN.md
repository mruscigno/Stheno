# App 6D-2 technical implementation plan

App 6D-2 may begin only after rights proof is accepted and a visual-review batch is approved.

1. Freeze a batch by source SHA-256 and reviewed `asset_id`.
2. Require a reviewed canonical exercise ID; never join on display name.
3. Transcode privately to the existing mobile/web delivery profile and generate a poster.
4. Store source hash, derivative hashes, provenance, license key, reviewer, review date, and media role.
5. Import additively behind a disabled rollout flag. Do not replace the 298 purchased mappings automatically.
6. Validate API caching, offline download behavior, accessibility, low-bandwidth fallback, and rollback.
7. Run the 330 checksum and 298-mapping regression gates before and after the batch.

Recommended first batch: only exact-name candidates that later pass visual, safety, and rights review; cap the first batch at 20 assets.
