# Test results

- Root TypeScript: pass.
- Mobile TypeScript: pass.
- Root ESLint: pass with eight pre-existing warnings and zero errors.
- Targeted API/monthly engine tests: 6/6 pass.
- Mobile tests: 11/11 pass.
- Mobile ESLint: pass.
- Expo web export: pass, including native Progress route bundle.
- Full root Vitest: started but did not complete within the local execution window; targeted affected tests passed.
- Isolated Supabase CI: pass, including App 6C pgTAP and concurrent A/B race (`39806733118`).
- Android baseline CI: pass; installed/launched debug APK with clean process/UI/logcat checks and screenshot artifact (`39806733118`).
- Production build: pass and promoted as Vercel deployment `dpl_ArqYu8uRpr2GQhRXdAaGGNb523rb`.
- Production smoke: `/` 200, `/api/health` 200, protected App 6C endpoints 401 without credentials, and zero error-level logs in the available 20-minute Vercel window.
