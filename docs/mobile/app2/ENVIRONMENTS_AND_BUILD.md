# Environments and build

`app.config.ts` separates development from non-development name, scheme, and package identifiers. `eas.json` defines development, internal preview, and production profiles. `.env.example` documents public values without secrets.

Required public variables:

- `EXPO_PUBLIC_ENVIRONMENT`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_ENABLE_ASSESSMENT_SCAFFOLD`

Expo client bundles require direct static references to `process.env.EXPO_PUBLIC_*`; a regression found during browser validation was corrected accordingly.

No EAS project was initialized and no app-store build was submitted.
