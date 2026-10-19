# API catalog and OpenAPI diff

- `POST /api/v1/assessment-sessions` — create; capability returned once.
- `GET /api/v1/assessment-sessions/{id}` — resume with capability header.
- `PUT /api/v1/assessment-sessions/{id}/answers` — replace answer snapshot with revision.
- `POST /api/v1/assessment-sessions/{id}/finalize` — validate and build Blueprint.
- `GET /api/v1/assessment-sessions/{id}/blueprint` — capability-protected read.
- `POST /api/v1/assessment-sessions/{id}/claim` — bearer auth plus capability; atomic/replay-safe.

All use the App 1 envelope and `x-stheno-assessment-capability`; the secret never appears in URLs.
