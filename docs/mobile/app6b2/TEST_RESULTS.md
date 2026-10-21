# Test results

Final evidence collected on 2026-10-21:

- Root `pnpm verify`: lint completed with 0 errors (8 pre-existing warnings), TypeScript passed, 60 test files / 243 tests passed, and the 147-page production build completed.
- App 6B-1/App 6B-2 targeted suite after the FFmpeg runtime-resolution change: 3 files / 14 tests passed.
- Mobile `typecheck`: passed.
- Mobile `lint`: passed with 0 errors.
- Mobile tests: 5 files / 11 tests passed.
- Mobile web export: passed and emitted 29 static routes.
- Isolated GitHub Supabase run `39659424516`: every migration applied to an ephemeral project; existing App 4.7 suite 24/24, App 6B-1 security suite 13/13, App 6B-2 budget suite 8/8, and the concurrent claim race all passed.
- Real four-frame inference: HTTP 200, structured schema and grounding checks passed.
- Real one-frame inference: HTTP 200, explicit abstention passed.
- Two FFmpeg preview packaging attempts failed before provider invocation; one 800-token provider response was rejected as invalid. Failed attempts remain in the budget ledger rather than being hidden.

No production Supabase migration or public feature activation occurred.

