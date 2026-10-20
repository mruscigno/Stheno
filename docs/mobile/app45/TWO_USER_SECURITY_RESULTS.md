# Two-user security results

Status: **BLOCKED**.

The required A/B isolation test was not run. The accessible Supabase account contains the production STHENO project but no dedicated STHENO staging project or branch. Creating synthetic accounts, private-photo fixtures, or capability claims in production would violate the package's safety rules.

The outstanding test must use two synthetic users in a non-production STHENO backend and verify isolation for profiles, programs/workouts, progress observations, monthly reviews, private photo objects, assessment capabilities, and account claims. Cross-user reads and writes must fail at both the API and storage layers.

Static review found no mobile service-role or Supabase secret key. Mobile API authorization uses the signed-in user's access token; token values are not logged by the app code.
