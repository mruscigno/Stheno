# Root cause and fix

## Root cause

The reported “API-35 input loss” was primarily an automation visibility defect. React Native descendants remained in UIAutomator output after clipping. The old locator accepted any matching node with a computed center, including inverted and off-screen bounds. ADB accepted the command, but Android InputManager rejected injection because the target coordinate was not actionable. The deepest prior run proves the product data itself survived the process death.

The latest prior run also exposed an independent fixture weakness: a long, nonessential free-text assessment answer was used as a prerequisite for a workout test, allowing IME throughput to block the actual acceptance path.

## Minimal fix

- Reject inverted, clipped, or off-screen nodes and poll/scroll until the semantic target is genuinely actionable.
- Verify the intended field owns focus before injection and verify its displayed value afterward.
- Clear fields with bounded individual key events instead of one oversized shell command.
- Use a short deterministic free-text fixture while preserving all 45 assessment steps.
- Capture screenshot, UI hierarchy, and logcat on every failed transition.
- Capture device SQLite archives after the first restart, second restart, and final replay; assert status, set counts, pending operations, owner count, and duplicate-session count.

Run `40888006569` also showed why the actionable threshold must use the actual app viewport rather than the workout screen's content-footer boundary: an assessment Continue button at `[63,2074][1017,2211]` is valid inside the 2274px app viewport. The selector now rejects inverted geometry while accepting valid controls anywhere above the navigation bar.

No workout storage, protocol, or user-facing workflow was replaced.

