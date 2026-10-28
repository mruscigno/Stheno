# Native walkthrough results

Final current-source Android evidence run: `40756034444`, commit `914c98d7e07962779bf22c06e21e720da3c6f7b7`.

| Required step | Result | Genuine evidence |
|---|---|---|
| Real auth, claim and assigned workout | PASS | `07-verification-required`, `08-member-today`, `09-real-program` PNG/XML |
| Full workout and sync component | PASS | `10-workout-online.png/xml`; status node is `Saved` |
| Overall timer | PASS | `10-workout-online` shows the running workout timer; production cadence remains one second |
| Rest timer behavior | PARTIAL | A completed set started the timer, but the run proceeded immediately to offline persistence and did not capture a dedicated timer milestone |
| Offline set write and SQLite state | PASS | `11-workout-offline-saved.png/xml`; status node is `Offline · saved locally` |
| Force-stop and offline restore | FAIL | `failure.png/xml`: app stalls at `Restoring your private assessment…` after relaunch without network |
| Reconnect / ordered replay / Saved | NOT REACHED | Blocked by offline bootstrap failure |
| Duplicate acknowledged delivery | NOT REACHED | Blocked by offline bootstrap failure |
| Real stale-revision conflict UI | NOT REACHED | Blocked by offline bootstrap failure |
| Completion and server history | NOT REACHED | Blocked by offline bootstrap failure |
| Online cold restart/history | NOT REACHED | Blocked by offline bootstrap failure |

The release decision is **BLOCKED**. Passing the accessibility selector is not relabeled as a complete workout lifecycle pass.
