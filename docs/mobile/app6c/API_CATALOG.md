# API catalog

- `GET /api/v1/progress`: review state, reviews, recommendations, check-ins, and completed photo-set metadata.
- `GET|POST /api/v1/monthly-reviews`: history and start/resume.
- `GET|PATCH /api/v1/monthly-reviews/:id`: details and optimistic-revision intake save.
- `POST /api/v1/monthly-reviews/:id/decisions`: idempotent accept-all, apply-selected, or keep-current command.
- `GET|POST|PUT|DELETE /api/v1/progress/photos`: signed retrieval, consented set creation/finalization, upload, and set/all deletion.

All routes accept the existing cookie session and native Supabase bearer token. Expired access retains the standard membership boundary.
