# API and schema

Implemented shared endpoints:

- `POST /api/v1/coach/form-reviews/upload-intent`
- `POST /api/v1/coach/form-reviews`
- `GET /api/v1/coach/form-reviews/:id`
- `DELETE /api/v1/coach/form-reviews/:id`
- `GET /api/v1/coach/form-reviews/:id/media`

`coach_form_reviews` stores owner, consent, exercise/rubric version, lifecycle, quota/cost fields, retention deadline, and structured result. `coach-form-videos` is a private 75 MB MP4/MOV bucket. Owner RLS protects database rows and owner/folder policies protect objects. The migration is additive and located at `supabase/migrations/20261021183000_app6b_private_form_reviews.sql`.

