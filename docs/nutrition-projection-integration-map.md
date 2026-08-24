# Nutrition intelligence integration map

- Assessment: `personalization_profile_snapshots.profile` and `/api/assessment` remain the baseline source.
- Monthly check-in: `monthly_reviews.intake` and `/api/progress/monthly` remain canonical.
- Weekly check-in: `weekly_checkins` remains the recurring body-weight and adherence source.
- Progress photos: existing implementation reused; no duplicate implementation.
- Nutrition targets: existing effective-dated `nutrition_targets` remains canonical target history.
- Body metrics: assessment baseline plus dated weekly/monthly weights are unified by the body-trend reader.
- Progress: `/app/progress` is extended with projection intelligence.
- Coach: `/api/coach` receives a structured nutrition snapshot; its conversation architecture is unchanged.
- Auth/RLS: existing Supabase SSR auth; all new rows are owner-scoped with RLS and explicit grants.
- Analytics: existing server/client capture utilities and event allow-list are extended.
- Timezone: entry `local_date` is supplied from the member's browser; canonical instants remain `timestamptz`.

No parallel assessment, check-in, photo, target, Progress, or Coach domain is introduced.
