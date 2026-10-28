# Root cause

Run `40756034444`, artifact `12846314168`, proved authentication and offline SQLite persistence before process kill. On cold launch without network, Supabase restored the secure session, but `AuthProvider.bootstrap` set status to `loading` until `/me`, Today, Program, Nutrition and Progress all succeeded. Network failure changed status to `error`. The root assessment route handled neither state as an authenticated member and remained at `Restoring your private assessment…`.

`WorkoutProvider` also derived ownership from `auth.member.id`, which is an online read model rather than the securely persisted session identity. Thus it could not load the already user-partitioned SQLite workout offline.
