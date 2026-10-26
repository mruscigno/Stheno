# Auth and claim security

- Supabase Auth email confirmation remained enabled.
- CI verified the real local email through Mailpit and the native PKCE callback; no admin confirmation bypass was used.
- Claim requests carried both the authenticated bearer token and device-held anonymous capability.
- `claim_anonymous_assessment` remained the atomic ownership/program boundary.
- Passing evidence records claim creation as `201` and replay as `200`.
- The isolated ownership matrix rejected cross-user access and production-shaped credentials.
- Database assertions confirmed exactly one claimed session, assessment, and program prescription.
- Diagnostics excluded credentials, tokens, email content, answers, and health data.

