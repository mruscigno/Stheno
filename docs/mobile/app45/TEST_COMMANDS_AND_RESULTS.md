# Test commands and results

| Command | Result |
| --- | --- |
| `pnpm --dir apps/mobile lint` | Pass |
| `pnpm --dir apps/mobile typecheck` | Pass |
| `pnpm --dir apps/mobile test` | Pass: 5 files, 11 tests |
| `pnpm --dir apps/mobile doctor` | Pass; global pnpm bin PATH warning only |
| `pnpm lint` | Pass with 8 pre-existing warnings and 0 errors |
| `pnpm typecheck` | Pass |
| `pnpm test` | First parallel run was host-resource constrained; isolated retry passed: 55 files, 221 tests |
| `pnpm build` | Pass: production Next.js build, 143 static pages generated |
| `pnpm --dir apps/mobile export:web` | Pass: 29 static routes, including both auth callback paths |
| `expo prebuild --platform android --no-install` | Pass |
| `gradlew assembleDebug --no-daemon` | Fail: worker-daemon timeouts under host load |
| `gradlew assembleDebug --no-daemon --max-workers=1` | Fail: Worklets CMake/Ninja dirty-manifest loop |

The native build failures occurred after configuration and source compilation advanced substantially, but they do not count as a successful build or runtime gate.
