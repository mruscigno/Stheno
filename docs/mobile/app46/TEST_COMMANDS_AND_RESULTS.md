# Test commands and results

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm --dir apps/mobile exec expo install --check` | PASS; dependencies current |
| `pnpm --dir apps/mobile typecheck` | PASS |
| `pnpm --dir apps/mobile test` | PASS; 5 files / 11 tests |
| `pnpm --dir apps/mobile lint` | PASS |
| `pnpm --dir apps/mobile doctor` | PASS; one PATH warning |
| `pnpm --dir apps/mobile export:web` | PASS; 75 output files |
| Android `assembleDebug` | PASS; 10m21s |
| Android second `assembleDebug` | PASS; 2m19s |
| `pnpm lint` | PASS; 0 errors / 8 warnings |
| `pnpm test` | PASS; 55 files / 221 tests |
| `pnpm build` | PASS; 143 static pages |

Runtime and live staging tests are separately marked blocked; passing compilation and unit tests are not represented as substitutes.
