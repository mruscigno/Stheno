# Web and library regression

- Root test suite: **55 files, 221 tests passed**.
- Root production build: **PASS**, 143 static pages generated.
- Root lint: **PASS** with 8 pre-existing warnings and 0 errors.
- Mobile test suite: **5 files, 11 tests passed**.
- Mobile typecheck: **PASS**.
- Mobile doctor: **PASS** with only the existing pnpm global-bin PATH warning.
- Mobile web export: **PASS**, 75 files emitted.
- Expo dependency compatibility check: **PASS**.

The existing tests retain the shared assessment contract, canonical exercise identifiers/media invariants, member navigation, auth/deep-link routing, and web application behavior. No product feature was removed to obtain the native build.
