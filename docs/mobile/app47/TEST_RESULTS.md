# Test results

## Isolated Supabase

- Fresh local migration chain: PASS
- pgTAP security suite: PASS, 24/24
- Concurrent A/B claim race: PASS, one winner and rejected loser
- Isolation/credential guard: PASS

## Mobile repository

- Mobile Vitest: PASS, 5 files / 11 tests
- Mobile TypeScript: PASS
- Mobile ESLint: PASS

## Android

- Exact APK checksum: PASS
- API 35 x86_64 installation: PASS
- Metro bundle and STHENO process launch: PASS
- React Native error-screen and system-dialog rejection: PASS
- Full staging-backed native walkthrough: BLOCKED

Final hosted validation: <https://github.com/mruscigno/Stheno/actions/runs/39460544550>

Earlier install/runtime diagnostics: <https://github.com/mruscigno/Stheno/actions/runs/39455181245>

