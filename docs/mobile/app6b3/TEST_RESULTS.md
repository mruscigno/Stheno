# Test results

Final results:

- targeted form-review tests: 3 files / 14 tests passed;
- root lint: 0 errors and 8 pre-existing warnings;
- root TypeScript: passed;
- root tests: 60 files / 244 tests passed;
- Next.js production build: 147/147 static pages generated;
- mobile TypeScript and lint: passed;
- mobile tests: 5 files / 11 tests passed;
- mobile Expo web export: 29 static routes emitted;
- Vercel runtime decode probe: HTTP 200, 12 frames, 850 ms;
- temporary runtime endpoint unauthenticated behavior was concealed as 404 by design;
- preview deployment and secret removal: passed.
- isolated Supabase run `39673419709`: migrations passed; pgTAP 24 + 13 + 8 + 12 = 57/57; concurrent A/B claim race passed.
- inert production smoke: homepage 200, anonymous upload-intent POST 401, unauthenticated worker 401, and zero runtime error records in the first 15-minute window.

The build initially reported a Turbopack trace warning at dynamic `spawn`; the documented `turbopackIgnore` annotation was added while the explicit FFmpeg output-file trace remains configured.
