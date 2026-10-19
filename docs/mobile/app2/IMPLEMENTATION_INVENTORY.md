# Implementation inventory

- `apps/mobile/app`: Expo Router screens and native navigation.
- `apps/mobile/src/providers/AuthProvider.tsx`: session bootstrap and member read models.
- `apps/mobile/src/lib/supabase.ts`: Supabase client and foreground refresh lifecycle.
- `apps/mobile/src/lib/secure-store.ts`: chunked Expo SecureStore adapter.
- `apps/mobile/src/lib/api.ts`: App 1 bearer client adapter.
- `apps/mobile/src/lib/deep-links.ts`: strict auth callback parsing.
- `apps/mobile/src/lib/analytics.ts`: privacy-safe event allowlist.
- `apps/mobile/assets`: exact orange STHENO vector logo plus derived native icon/splash PNGs.
- `src/platform/contracts/api.ts`: exported concrete member and Today read-model types.
- `src/platform/client/api-client.ts`: concrete typed `me()` and `today()` methods.

No schema, RLS, production website, billing, anonymous assessment persistence, or exercise-library content was changed.
