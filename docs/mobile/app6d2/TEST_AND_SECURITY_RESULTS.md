# Test and security results

- Root TypeScript: passed.
- Mobile TypeScript: passed.
- Focused exercise/media tests: 9 passed.
- Mobile tests: 25 passed.
- Canonical 330 and Vital fallback tests: passed.
- Dry-run replay: 52 planned, 52 after replay, zero duplicates.
- Private conversion: 52 unique MP4 hashes and 52 unique poster hashes.
- RLS design: source/review tables inaccessible to client roles; approved read-only derivative/link policies only.
- Feature flag: off by default.
- Purchased binaries: absent from Git staging.
- Production DDL/storage/public activation: not performed.

Real Postgres migration execution, storage-policy validation, web playback, Android emulator playback, low-bandwidth behavior, and iOS playback remain pre-activation checks.
