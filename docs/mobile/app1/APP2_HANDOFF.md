# App 2 Handoff

## Ready foundation

- Import mobile-safe contracts from `src/platform/contracts/api.ts` and transport from `src/platform/client/api-client.ts` when workspace extraction begins.
- Authenticate with Supabase React Native, store sessions in SecureStore, and supply the current access token to the API client.
- Use `/api/v1/me` for bootstrap/access, then Today/Program/Nutrition/Progress reads.
- Persist mutation `operationId`, resource ID, payload, and base revision until an acknowledgment is received.
- Use `openapi.json` as the implemented contract inventory; do not call routes marked planned.

## App 2 entry gate

Before feature UI begins, confirm the production migration/deployment, test a real native-issued bearer token, finalize app bundle identifiers/deep links, and decide which current gaps App 2 owns. The recommended first native vertical slice is sign-in → `/me` → Today read-only.

## Dependencies still owned by later apps

- App 3: server anonymous assessment sessions, secure resume/claim, optional staged photos, native deep links and acquisition flow.
- App 2B/Store work: provider-neutral entitlements and native billing; Stripe remains authoritative now.
- App 4/5: complete workout substitution/adaptation APIs and atomic offline operation reservation/finalization.
- Progress: versioned monthly intake and private photo upload APIs.
- Platform: rate limiting, device registration, push preferences, signed media policy.

Do not duplicate program generation, Coach, billing, or adaptation logic in the mobile client.
