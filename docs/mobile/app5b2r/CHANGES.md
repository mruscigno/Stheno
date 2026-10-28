# Changes

- Replaced the footer's bare `Text` selector target with a real, non-collapsible, accessible native `View`.
- Kept the genuine visible status text and added state-specific labels: `Workout sync status: Saved`, `Saving…`, and `Offline · saved locally`.
- Updated the genuine Android journey to verify the accessibility label for offline and saved states.
- Added a Node regression contract that fails if the app accessibility ID/label and the journey selector drift apart.
- Added that contract to the existing pre-build invariant gate.

Classification: targeted product accessibility fix plus matching test-contract hardening. No backend, schema, workout semantics, or unrelated UI changed.
