# App 1 Test Results

## Baseline before implementation

| Gate | Result |
|---|---|
| `pnpm lint` | Passed with 8 pre-existing warnings and 0 errors |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed: 50 files, 208 tests |
| `pnpm build` | Passed: 140 static pages |
| Canonical exercise identity | Passed: 330 slugs, SHA-256 `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b` |
| Purchased exercise media | Passed: 298 mappings, 298 MP4 files, 298 poster files |

## App 1 automated coverage

The App 1 suite adds contract validation, exercise-library identity protection, deterministic payload hashing/idempotency behavior, and typed client transport tests. The initial focused run passed 3 files and 7 tests. The complete post-implementation gate is recorded below after the final rerun.

## Production database verification

Migration `20261019173220_mobile_app1_api_idempotency.sql` was applied in the signed-in Supabase SQL editor on 2026-10-19. A direct catalog query returned:

- `relrowsecurity = true`
- 2 policies on `public.api_idempotency_records`
- authenticated role has `SELECT = true`
- authenticated role has `INSERT = true`
- authenticated role has no update/delete grant in the migration

The connected Supabase API token returned `You do not have permission to perform this action` for SQL verification and advisor reads, so those checks were performed in the signed-in dashboard. Advisor results could not be exported through the plugin and are recorded as a tooling limitation rather than a passing check.

## Live integration limitations

- Cross-user denial tests require two seeded non-production identities and remain an explicit P1 integration-test blocker.
- Authenticated production latency cannot be measured responsibly without a test member credential.
- Anonymous assessment claim is intentionally deferred to App 3 rather than shipping an insecure token shortcut.

## Final gate

| Gate | Final result |
|---|---|
| `pnpm lint` | Passed: 0 errors, 8 pre-existing warnings |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed: 54 files, 217 tests, 94.14 seconds |
| `pnpm build` | Passed: compiled in 16.8 seconds, TypeScript in 13.0 seconds, 140 static pages |
| `git diff --check` | Passed |
| Required deliverables | Passed: 19/19 present |
| Artifact parsing | Passed: OpenAPI JSON, baseline JSON, and route CSV |

Production deployment smoke-test results are recorded in `FINAL_STATUS.md` after release verification.
