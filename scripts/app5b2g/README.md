# Android acceptance scenarios

The acceptance journey is split into five independently invoked processes. The
default runner executes them in dependency order while preserving the emulator,
app data, isolated Supabase project, and local API between processes:

1. `bootstrap`
2. `response-loss` (scenario F)
3. `offline-recovery` (scenarios A–E and I)
4. `revision-conflict` (scenario G)
5. `account-isolation` (scenario H)

Run the complete ordered suite with:

```bash
bash scripts/app5b2g/run-android-e2e.sh
```

During diagnosis, rerun only the failed scenario against the still-running
acceptance environment and emulator:

```bash
node scripts/app5b2g/android-e2e.mjs --scenario=revision-conflict
```

The scenario processes use `testID`/resource IDs for application controls.
Visible copy is not a locator contract. Android system confirmation buttons use
the platform resource ID `android:id/button1`.

Every selector or transition failure records a PNG, UIAutomator hierarchy,
logcat, activity stack, window state, and the Expo Router pathname exposed by
the test-only `navigation-state` accessibility node. Review that evidence and
classify the fault as application or automation before changing either side.

Only after all five scenario processes pass should the complete suite be run
twice from the same commit in separate GitHub Actions runs.
