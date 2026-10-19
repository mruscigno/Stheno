# Architecture and dependencies

The monorepo now uses a pnpm workspace with `apps/mobile`. The app uses Expo 58, React Native 0.88, React 19.3, Expo Router, Supabase JS, Expo SecureStore, Zod, and the existing shared platform client/contracts.

Flow: native screen → `AuthProvider` → Supabase session → typed App 1 client → `https://www.sthenofitness.com/api/v1/*`. The app never connects directly to product tables and contains no privileged credential. Independent member bootstrap requests run in parallel.

The Expo web export is validation evidence only; it is not a replacement for iOS or Android acceptance.
