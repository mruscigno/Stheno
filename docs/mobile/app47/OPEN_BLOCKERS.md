# Open blockers

1. The complete Android native assessment-to-program walkthrough has not passed against an isolated staging backend.
2. The Android emulator and ephemeral Supabase jobs are isolated from production but are not yet joined into one data-backed runtime environment; the native app therefore reaches its honest connection-error state instead of the first assessment question.
3. The local Windows AVD remained offline during the single bounded attempt.
4. iOS runtime validation is outside the Android-focused App 4.7 package and remains pending.

No paid infrastructure is required to address these blockers. The preferred continuation is the free ephemeral GitHub Actions Supabase + emulator lane already established here.

