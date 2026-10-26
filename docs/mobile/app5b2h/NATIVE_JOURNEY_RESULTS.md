# Native journey results

Run [40414407657](https://github.com/mruscigno/Stheno/actions/runs/40414407657) passed the required one-session Android journey:

1. Fresh launch and canonical assessment.
2. Force-stop/resume during assessment.
3. Deterministic Blueprint generation.
4. Account creation with confirmation required.
5. Verification through local Supabase Mailpit and the native PKCE callback.
6. Atomic anonymous-assessment claim (`201`) and idempotent replay (`200`).
7. Real member Today and Program screens backed by API `200` responses.
8. Force-stop/cold launch with the authenticated session restored to Member Today.
9. SQL assertion `isolated_native_journey=passed` for one claimed session, assessment, and prescription.

The evidence log ends with `Native Assessment → Blueprint → Account → Claim → Program journey passed.`

