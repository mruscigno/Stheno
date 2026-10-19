# API Catalog

All implemented `/api/v1` responses use version `1.0`, a request ID, no-store caching, structured errors, and server-verified ownership. OpenAPI details are in `openapi.json`.

## Implemented reads

- `GET /api/v1/exercises` — public, cursor pagination (1–100), text/equipment/muscle/pattern filters.
- `GET /api/v1/exercises/{slug}` — public production exercise plus reviewed alternatives.
- `GET /api/v1/me` — member identity, profile, preferences, first-party trial/paid state, subscription, entitlements.
- `GET /api/v1/today` — active session, current program, review status, nutrition summary.
- `GET /api/v1/program` — current authoritative prescription.
- `GET /api/v1/nutrition` — current targets/activity/preferences/supplements.
- `GET /api/v1/progress` — review state/history/recommendations/check-ins and private photo-set metadata (not URLs).
- `GET /api/v1/monthly-reviews` — monthly review read model.

## Implemented mutations

- `POST /api/v1/workouts/sessions` — start/resume using operation and client session UUIDs.
- `PUT /api/v1/workouts/sessions/{sessionId}/sets/{setId}` — owner-scoped, stable set ID, operation UUID, canonical acknowledgment.
- `POST /api/v1/workouts/sessions/{sessionId}/complete` — idempotent completion and deterministic derived results.
- `POST /api/v1/monthly-reviews/{reviewId}/decisions` — apply selected IDs or keep current plan; each pending recommendation can be claimed once.
- `POST /api/v1/coach/questions` — bearer-compatible adapter over the existing Coach orchestration.

There is currently no global rate-limit service in the repository. Payload limits exist through Zod and provider controls; production rate limiting for Coach/public anonymous assessment remains open before native external beta.

## Designed but not implemented

Anonymous assessment sessions/resume/Blueprint/claim, native photo upload, nutrition mutation, substitution/adaptation v1 endpoints, monthly review start/complete v1 endpoints, device registration, and provider-neutral store billing are explicitly planned. They are not represented as implemented in OpenAPI.
