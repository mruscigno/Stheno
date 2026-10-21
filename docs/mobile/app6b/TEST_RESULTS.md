# Test results

Verified during implementation:

- Root TypeScript: pass.
- Mobile TypeScript: pass.
- Mobile ESLint: pass.
- Mobile Vitest: 5 files / 11 tests pass.
- App 6B + methodology + exact-exercise invariants: 3 files / 13 tests pass.
- Mobile Expo web export: pass, 29 static routes.
- Full `pnpm verify`: pass. ESLint reports 8 pre-existing warnings and 0 errors; TypeScript passes; Vitest passes 58 files / 234 tests; Next.js 16.3.1 production build passes with 146 static pages generated.

Not passed or claimed: real PostgreSQL two-user isolation, corrupt/expired signed-token integration, provider timeout/rate-limit/cost behavior, real native runtime, and analysis-quality evaluation. These remain activation blockers.

