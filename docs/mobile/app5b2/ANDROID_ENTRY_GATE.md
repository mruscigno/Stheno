# Android entry gate

Status: **FAILED / NOT EXECUTABLE IN THE CURRENT LANE**.

The Android job in `.github/workflows/app47-zero-cost-validation.yml` sets the API and Supabase hosts to emulator loopback, but does not start either service in that job. The isolated Supabase job is separate and its containers cannot be reached from the Android job. The Android job downloads the App 4.6 APK and launches it against Metro; it does not build/install the current source or automate the 45-question flow.

Consequently there is no genuine staging-backed evidence for Assessment → Blueprint → Account → claim → Program → Today, persisted server records, token refresh, or restart recovery. Run `39806733118` remains valid baseline launch evidence only.

Required remediation before Phase 2: one job must start an isolated Supabase stack, start the current Next API with that stack's keys, build/install current Android source, seed disposable identities, automate all 45 questions and auth/claim, verify database state, restart the app, and capture redacted screenshots/logs.

