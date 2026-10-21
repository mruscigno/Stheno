# Two-user 13-case results

GitHub Actions run `39659424516` completed successfully on 2026-10-21 in an isolated ephemeral Supabase environment.

- App 6B-1 security suite: **13/13 passed**.
- App 6B-2 atomic evaluation-budget suite: **8/8 passed**.
- Existing App 4.7 security suite: **24/24 passed**.
- Concurrent anonymous-assessment claim race: **passed**.

The App 6B-1 suite proves owner read/update behavior, cross-user read/update/delete isolation, worker RPC denial to member and anonymous roles, anonymous table denial, private bucket configuration, the 50 MB object limit, and owner-policy presence. The App 6B-2 suite proves atomic reservation/reconciliation and the hard $5 authorization ceiling.

Production migrations remain intentionally unapplied.

