# Web and Android playback evidence

## Captured evidence

- Seven private batch-2 review grids covering all 56 second-batch candidates were generated and visually inspected.
- 103 deterministic MP4/poster pairs were generated with recorded hashes and sizes.
- Web/native resolver fallback and ranked-set behavior are covered by automated tests.

## Not captured

No source-only screenshot is represented as production evidence. The new tables, storage objects, CDN base URL, and feature flag are not active, so genuine reviewed-media playback screenshots on production web or a fresh Android APK do not yet exist. Android workout-resume safety was not rerun for this inactive media-only candidate.

Required before activation: restricted staging upload, real desktop/mobile browser playback, network-error fallback, fresh Android emulator playback, back-to-workout state verification, source commit/APK hash, and screenshots tied to that build.
