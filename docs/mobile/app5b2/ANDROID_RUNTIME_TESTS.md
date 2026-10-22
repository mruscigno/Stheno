# Android runtime tests

No new Android runtime run was claimed. Run `39806733118` is retained only as a baseline APK install/launch check and cannot satisfy App 5B-2.

Local verification on this sprint:

- `pnpm exec vitest run src/platform/contracts/exercise-baseline.test.ts src/platform/server/workout-operations.test.ts` — exit 0, 2 files/4 tests passed.
- `pnpm --dir apps/mobile typecheck` — exit 0.
- `pnpm --dir apps/mobile test` — exit 0, 5 files/11 tests passed.
- `pnpm --dir apps/mobile lint` — exit 0.

iOS runtime remains pending because no macOS/cloud iOS lane is available.

