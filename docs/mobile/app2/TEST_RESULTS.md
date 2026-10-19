# Test results

Executed 2026-10-19:

- Mobile TypeScript: passed.
- Mobile ESLint: passed.
- Mobile unit tests: 5 files, 10 tests passed.
- Expo public config resolution: passed for iOS, Android, and web targets.
- Expo web static export: passed, 20 routes.
- Root website ESLint: passed with 8 pre-existing warnings and no errors.
- Root website TypeScript: passed.
- Root website tests: 54 files, 217 tests passed.
- Root Next.js production build: passed; 140 static pages generated.
- Expo Doctor: previously completed 20/20 during implementation; a later rerun stalled inside its package-manager dependency inspection and was terminated, with no new diagnostic emitted.
- Production App 1 health/public/unauthenticated contract probes: passed.
- Secret-pattern scan: no privileged secret in mobile source; the only `service_role` text is a negative unit-test fixture.
- Web preview: public routes rendered after correcting Expo environment inlining.

Not executed: iOS simulator build (Windows host), Android build (SDK absent), real-device deep links, and two-user isolation (fixtures absent).
