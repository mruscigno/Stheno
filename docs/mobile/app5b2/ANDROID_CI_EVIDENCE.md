# Android CI evidence

The `App 5B-2 Updated offline workout native gate` workflow builds a fresh APK, starts an isolated Supabase stack and real Next API, creates and claims an account, opens the generated program, starts a workout, enables airplane-mode-equivalent network loss, saves a set, force-stops the app, relaunches, restores the values, reconnects, and verifies one server session, one set, and one receipt.

Run URL, APK SHA-256, screenshots, UI XML, logs, and database assertions will be linked here after the first passing run from the final commit.
