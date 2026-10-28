# Android E2E evidence

Fresh current-source Android run pending.

The updated gate covers online set acknowledgement, two offline sets, process-kill recovery, exact field restoration, offline edit and completion, second kill/restart, reconnect/replay, database completion assertions and online cold restart. Final run/job, APK checksum, screenshots and exit code will be recorded here.

Run `40773117612` (commit `6fe2597`) stopped before authentication at `assessment-input-age`: the API 35 emulator acknowledged numeric key events but left the focused field empty. No App 5B-2S code path had executed. The harness now injects and verifies each numeric digit as text before advancing; this is a meaningful test-input correction, not an identical retry.

Run `40775685168` (commit `9723da0`) stopped at the first assessment screen. The backend log contained only the workflow's intentional anonymous-capability negative probes; the native app made no request to the isolated API. Android API 35 rejected the host-forwarded HTTP staging services because the generated manifest did not permit cleartext transport. Non-production builds now allow those isolated HTTP services while production Android builds remain HTTPS-only. A fresh run is required.
