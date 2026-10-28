# CI and artifacts

- Failed run: https://github.com/mruscigno/Stheno/actions/runs/40589956937
- Failed job: https://github.com/mruscigno/Stheno/actions/runs/40589956937/job/122491310446
- Failed evidence artifact: https://github.com/mruscigno/Stheno/actions/runs/40589956937/artifacts/12775648017
- Failed-run source: `979b6fe205c275a907c4cb0a03822770659386eb`
- Failed-run APK SHA-256: `bdb23295a8952185b0ce68526e5435605c2d09d4017cad7ab8935da781689501`

## First remediation run

- Run: https://github.com/mruscigno/Stheno/actions/runs/40746234944
- Job: https://github.com/mruscigno/Stheno/actions/runs/40746234944/job/123020664599
- Source: `7821446c05583818c5295f14ea1603bbe82b24dc`
- APK SHA-256: `bdb23295a8952185b0ce68526e5435605c2d09d4017cad7ab8935da781689501`
- Result: failed before workout navigation at `assessment-input-age`.
- Evidence: the age EditText was focused, empty and enabled while Continue remained disabled. API 35 returned success for the combined multi-keycode command without delivering either digit. The corrected harness sends one bounded ADB key event per digit.

The passing post-correction run/job, artifact inventory and final checksum will be recorded after the next fresh gate finishes.

## Second remediation run

- Run: https://github.com/mruscigno/Stheno/actions/runs/40750034931
- Source: `25662064f0a30991df8d79e44b77c7eb335d0301`
- Result: the full assessment/account/program path passed and the genuine workout visibly rendered `Saved`, but the assertion still read a stale member-screen hierarchy.
- Evidence: `failure.png` is the full workout with the Saved footer; `current-ui.xml` is the earlier member tab hierarchy. The continuously updating elapsed timer prevented a fresh UIAutomator idle snapshot, while the harness left and reused the prior remote XML.
- Correction: production retains one-second timing; diagnostic builds tick every five seconds to provide a hierarchy capture window. The harness now removes both remote and local XML, retries a compressed dump, and rejects anything that is not a newly captured hierarchy.

## Final evidence run and artifact

- Run: https://github.com/mruscigno/Stheno/actions/runs/40756034444
- Job: https://github.com/mruscigno/Stheno/actions/runs/40756034444/job/123055067052
- Commit: `914c98d7e07962779bf22c06e21e720da3c6f7b7`
- Artifact: https://github.com/mruscigno/Stheno/actions/runs/40756034444/artifacts/12846314168
- Artifact name: `app5b2-updated-offline-workout-native-evidence`
- APK SHA-256: `bdb23295a8952185b0ce68526e5435605c2d09d4017cad7ab8935da781689501`
- Captured milestones: opening assessment, assessment persistence, real Blueprint, account creation/verification, member Today, real Program, online workout, offline saved workout, failure screenshot/XML, masked logs, backend diagnostics and fresh APK.
- Result: accessibility and offline-save milestones passed; gate failed at offline process-kill restore because authenticated bootstrap requires network read models.
