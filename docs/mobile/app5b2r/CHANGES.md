# Changes

- Replaced the footer's bare `Text` selector target with a real, non-collapsible, accessible native `View`.
- Kept the genuine visible status text and added state-specific labels: `Workout sync status: Saved`, `Saving…`, and `Offline · saved locally`.
- Updated the genuine Android journey to verify the accessibility label for offline and saved states.
- Added a Node regression contract that fails if the app accessibility ID/label and the journey selector drift apart.
- Added that contract to the existing pre-build invariant gate.
- Made numeric Android entry deterministic by sending one API 35 key event per digit.
- Made hierarchy collection delete stale local/remote XML, retry a compressed dump, and reject missing fresh output.
- Kept the production elapsed timer at one-second cadence while using a five-second cadence only when native journey diagnostics are explicitly enabled, giving UIAutomator a stable capture window.

Classification: targeted product accessibility fix plus matching test-contract hardening. No backend, schema, workout semantics, or unrelated UI changed. The newly proven offline-auth/bootstrap defect is documented as a blocker rather than hidden by weakening the test.
