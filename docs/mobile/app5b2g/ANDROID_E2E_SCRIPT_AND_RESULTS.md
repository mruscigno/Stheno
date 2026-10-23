# Android E2E script and results

`scripts/app5b2g/android-e2e.mjs` drives the canonical fixture from `assessment-fixture.mjs`, verifies field entry and every step transition, forces an assessment restart/resume checkpoint, and captures screenshots/UI dumps. Proven on API 35 emulator: app launch, 45-question conditional assessment, persisted resume, finalization, and real Blueprint display. Not proven: account submission, atomic claim, member program, and cold restart. Final result: exit 1 at `Create test account` after the account route returned to Blueprint.
