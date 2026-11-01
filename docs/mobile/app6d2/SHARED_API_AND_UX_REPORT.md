# Shared API and UX report

The `/api/v1/exercises/[slug]` response now returns the exercise, reviewed alternatives, and resolved media. Both web and native use that contract.

The resolver attempts App 6D-2 media only when `STHENO_MEDIA_6D2_ENABLED=true`. It requires active and fully approved links, approved derivatives, and `STHENO_MEDIA_CDN_BASE_URL`. Every failure path returns the existing Vital animation or a written-guide-only state.

The public exercise page passes resolved media into the existing accessible video player. The native workout’s Exercise guide action now opens an in-app route instead of leaving the app. The guide preserves the workout route in navigation history and displays media, equipment, setup, execution, cues, mistakes, and stop/modify guidance. Workout sets, timers, durable outbox, and sync logic are unchanged.
