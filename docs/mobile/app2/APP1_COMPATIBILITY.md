# App 1 compatibility

The authoritative compatibility assessment is `APP1_INTEGRATION_REPORT.md`. App 2 consumes the existing bearer API and shared contracts; it does not create a parallel backend.

- Implemented and consumed: `/api/v1/me`, `/api/v1/today`, structured errors, Supabase bearer validation.
- Implemented but outside this sprint's UI: Program, Nutrition, Progress, workouts, monthly decisions, Coach.
- Designed only and not represented as working: anonymous assessment session/resume/claim, mobile photo upload, native billing.
- App 1 P0 blockers carried forward: anonymous claim security and atomic multi-table offline mutations.
