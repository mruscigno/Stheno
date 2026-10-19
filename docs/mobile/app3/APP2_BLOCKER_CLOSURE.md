# App 2 blocker closure

- Bearer authentication remains the native API mechanism and is reused by claim.
- Callback parsing accepts only `stheno`, `stheno-dev`, and the production HTTPS host.
- Required Supabase redirect entries remain manual: `stheno-dev://auth/callback` and `stheno://auth/callback`.
- Two-user live isolation and native runners remain hard gates; neither was fabricated locally.
