# Test commands and results

Local pre-push results:

- `node --test scripts/app5b2g/android-accessibility-contract.mjs` — 1/1 passed.
- `node scripts/app5b2g/verify-fixture.mjs` — 45 canonical assessment steps verified.
- `pnpm --dir apps/mobile typecheck` — passed.
- `pnpm --dir apps/mobile test` — 7 files, 20/20 tests passed.
- `pnpm exec vitest run src/platform/contracts/exercise-baseline.test.ts src/platform/server/workout-operations.test.ts` — 2 files, 4/4 tests passed.

GitHub run [40884720428](https://github.com/mruscigno/Stheno/actions/runs/40884720428) performs the fresh APK, isolated Supabase/Postgres/Auth/Storage, API, SQL, native, SQLite, and final database gates.

- Run `40884720428`: blocked at age because the first shortened fixture incorrectly replaced a numeric answer; app validation correctly rejected it.
- Run `40888006569`: progressed through 15 assessment steps, then exposed an overly conservative selector viewport cutoff on a valid Continue button.
- Run `40891861003`: the full native UI journey passed through final cold restart; the post-journey evidence step failed because the first archive path captured Android `databases` but Expo SQLite lives in `files/SQLite`.

