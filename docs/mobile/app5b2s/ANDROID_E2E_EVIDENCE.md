# Android E2E evidence

Fresh current-source Android run pending.

The updated gate covers online set acknowledgement, two offline sets, process-kill recovery, exact field restoration, offline edit and completion, second kill/restart, reconnect/replay, database completion assertions and online cold restart. Final run/job, APK checksum, screenshots and exit code will be recorded here.

Run `40773117612` (commit `6fe2597`) stopped before authentication at `assessment-input-age`: the API 35 emulator acknowledged numeric key events but left the focused field empty. No App 5B-2S code path had executed. The harness now injects and verifies each numeric digit as text before advancing; this is a meaningful test-input correction, not an identical retry.
