# Regression and security

- Canonical compatibility catalog: 330 slugs; sorted newline-delimited SHA-256 `607bbb3eba2ff60e98bf41ef68f733f6033c0f99c795b8e1f82e7c7fde07370b`.
- Purchased provider fallbacks: 298 preserved; no existing media mapping changed.
- Source media never left the local workspace for classification.
- Local model output is evidence only; it does not assert medical, credentialed safety or professional technique approval.
- Production feature flag stays off and all prepared links stay inactive.
- RLS/grants follow current Supabase guidance: explicit minimum grants plus row policies; no service-role key or privileged client mutation was added.
- Root TypeScript check: passed.
- Repository test suite: 62 files / 252 tests passed, including the 330-ID and 298-mapping contract.
- ESLint: zero errors; eight pre-existing warnings outside this package.
- Production build: passed; 147 static pages generated.
