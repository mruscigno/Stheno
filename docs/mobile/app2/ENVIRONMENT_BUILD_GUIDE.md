# Environment and build guide

1. Copy `apps/mobile/.env.example` to an ignored local environment file and provide only public values.
2. From the repository root, run `pnpm install`.
3. Validate with `pnpm --filter @stheno/mobile typecheck`, `lint`, `test`, and `run doctor`.
4. Start Metro with `pnpm --filter @stheno/mobile start`.
5. Use an iOS simulator on macOS or an Android emulator/device with its SDK installed.
6. Add the two native callback URLs from `DEEPLINK_CONFIG.md` to Supabase before auth testing.
7. Obtain founder approval and confirm store availability before locking bundle/package IDs or running EAS production initialization.

Never place a service-role, Stripe, OpenAI, Resend, or other server secret in `EXPO_PUBLIC_*`.
