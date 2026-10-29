# Android E2E evidence

Fresh current-source Android run pending.

The updated gate covers online set acknowledgement, two offline sets, process-kill recovery, exact field restoration, offline edit and completion, second kill/restart, reconnect/replay, database completion assertions and online cold restart. Final run/job, APK checksum, screenshots and exit code will be recorded here.

Run `40773117612` (commit `6fe2597`) stopped before authentication at `assessment-input-age`: the API 35 emulator acknowledged numeric key events but left the focused field empty. No App 5B-2S code path had executed. The harness now injects and verifies each numeric digit as text before advancing; this is a meaningful test-input correction, not an identical retry.

Run `40775685168` (commit `9723da0`) stopped at the first assessment screen. The backend log contained only the workflow's intentional anonymous-capability negative probes; the native app made no request to the isolated API. Android API 35 rejected the host-forwarded HTTP staging services because the generated manifest did not permit cleartext transport. Non-production builds now allow those isolated HTTP services while production Android builds remain HTTPS-only. A fresh run is required.

Run `40779121981` (commit `1dfaffc`) proved the transport correction: the native app completed the full assessment, email verification, idempotent account claim, real program load, workout creation, and online set-1 acknowledgement. After connectivity was disabled, the product displayed `Offline · saved locally`; the run stopped because the API 35 automation keyboard discarded the single digit for `Set 2 repetitions`. The input harness now verifies each partial numeric value and falls back to the corresponding Android numeric keycode before the bounded whole-field verification.

Run `40782660655` (commit `a19cde9`) reproduced the API-35 shell-keyboard loss on that same focused offline repetitions field even with the keycode fallback. This is an automation input limitation, not a local-storage failure. The journey now changes both offline set loads, retains the real program's prescribed reps/RIR defaults, and explicitly verifies every load/reps/RIR value after process death. This removes the irrelevant offline-keyboard dependency without weakening the restoration assertion.

Run `40787050743` (commit `2533a43`) cleared the former set-2 stopping point and completed that offline set. The API-35 shell keyboard then discarded the load typed into set 3 after the offline rest-state rerender. The journey now completes set 3 using its valid prescribed unloaded state and verifies the exact `lb` placeholder, `6` reps, and `3` RIR after process death. Set 2 remains the changed offline load and the later offline edit target.

Run `40790540383` (commit `dab2dbb`) completed both offline sets, killed the process, restored the exact owner workout, and passed all exact load/reps/RIR assertions. It then stopped while replacing the restored set-2 load from `55` to `60`: the existing controlled input value was not selected on focus. Workout numeric fields now use `selectTextOnFocus`, which is also the correct member UX for replacing previously logged values without manually deleting them first.
