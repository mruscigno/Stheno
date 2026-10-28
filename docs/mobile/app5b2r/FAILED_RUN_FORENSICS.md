# Failed-run forensics

Run `40589956937` passed checkout, dependency install, fixture/invariant checks, isolated Supabase migrations, two-user security, real API startup, fresh APK build, Metro, emulator boot and APK install. The native journey finalized and claimed the assessment, loaded Today and Plan, pressed `Start workout`, and mounted `/workout`.

The final screenshot visibly shows the genuine full workout and a green `Saved` footer. Metro records `workout_entry_pressed` followed by `workout_route_mounted`. No JS/native exception or backend/auth error occurred. Android's uploaded hierarchy did not expose `workout-sync-status`; it contained a stale Today hierarchy. The assertion consequently timed out at line 234.

Root cause: **genuine Android accessibility exposure defect**. A React Native `Text` had a `testID`, but it was not forced into a stable native accessibility node. The product state and route were correct; the selector contract was not represented in Android's hierarchy. ColorBuffer messages were incidental emulator diagnostics, not the cause.
