# Native API integration

App 2 uses the App 1 typed client with `Authorization: Bearer <Supabase access token>`. It calls `/api/v1/me` and `/api/v1/today` concurrently and rejects envelopes outside API version `1.0`.

Observed production behavior before implementation: health and public exercise reads returned 200; `/me`, `/today`, `/program`, `/nutrition`, and `/progress` returned the expected structured 401 without authentication. No cookie emulation, service-role key, or parallel mobile API was added.

Errors are translated into safe user messages for expired session, membership-required, rate-limit, offline, and generic service conditions.
