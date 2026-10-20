# Two-user security results

## Status: BLOCKED

The required live matrix was not run because an isolated Supabase environment was unavailable. Automated repository tests are useful regression evidence but are not a substitute for live RLS/API/Storage/Auth verification.

Pending matrix:

| Surface | User owns record | Other user reads | Other user writes |
| --- | --- | --- | --- |
| assessment session and claim | allow | deny | deny |
| blueprint/program | allow | deny | deny |
| workout session and sets | allow | deny | deny |
| nutrition/progress/monthly review | allow | deny | deny |
| Coach messages/actions | allow | deny | deny |
| progress-photo storage | allow | deny | deny |

The gate stays closed until every deny is observed against a real isolated backend and the anonymous-to-account claim is proven to transfer only the claimant's data.
