# Native runtime gate

Gate: **not approved for public activation**.

TypeScript, ESLint, mobile unit tests, and Expo web export pass. GitHub Actions run `39806733118` also passed the genuine Android baseline: install, launch, process-health, UI dump, logcat fatal/ANR checks, and screenshot capture. That APK validates the native shell but does not activate or exercise App 6C consent, picker, upload, signed retrieval, decision replay, and deletion. `EXPO_PUBLIC_PROGRESS_V1_ENABLED` therefore remains `false` until a feature-specific walkthrough is captured.
