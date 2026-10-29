# Test commands and results

Local pre-push results:

- `node --test scripts/app5b2g/android-accessibility-contract.mjs` — 1/1 passed.
- `node scripts/app5b2g/verify-fixture.mjs` — 45 canonical assessment steps verified.
- `pnpm --dir apps/mobile typecheck` — passed.
- `pnpm --dir apps/mobile test` — 7 files, 20/20 tests passed.
- `pnpm exec vitest run src/platform/contracts/exercise-baseline.test.ts src/platform/server/workout-operations.test.ts` — 2 files, 4/4 tests passed.

GitHub run [40884720428](https://github.com/mruscigno/Stheno/actions/runs/40884720428) performs the fresh APK, isolated Supabase/Postgres/Auth/Storage, API, SQL, native, SQLite, and final database gates.

