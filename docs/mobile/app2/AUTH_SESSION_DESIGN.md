# Auth and session design

Supabase Auth remains the identity authority. `getSession()` restores the secure local session; App 1 validates the access token independently on every bearer request. An auth-state listener updates the app and clears local user state on sign-out. App foregrounding resumes token refresh and backgrounding stops it.

Password reset sends a neutral confirmation to prevent account enumeration. Verification and recovery callbacks use PKCE/code exchange or token-hash verification. Expired or malformed links route to a safe sign-in recovery state.

Required Supabase redirect allowlist before device QA:

- `stheno-dev://auth/callback`
- `stheno://auth/callback`

The proposed identifiers are `com.sthenofitness.app.dev` and `com.sthenofitness.app`; they are not represented as registered or founder-approved.
