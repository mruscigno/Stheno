# Open blockers and costs

## Blockers

1. A device lane that can boot the x86_64 APK. The current Windows host's clean AVD remains offline.
2. An isolated STHENO Supabase project or branch with permission to apply migrations, create two synthetic users, test RLS/API/Storage, and tear down.
3. A macOS/Xcode lane for iOS validation.

## Cost boundary

No paid resource was created. Supabase preview branches accrue compute cost and are not protected by the spend cap. A branch therefore requires explicit cost confirmation through Supabase before creation. EAS/Firebase device execution likewise requires an authorized account and confirmation that the selected lane is covered by an existing free quota or approved budget.
