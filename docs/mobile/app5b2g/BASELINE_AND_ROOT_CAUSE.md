# Baseline and root cause

Baseline commit: `f74da819bb1e03a0c012ddc8082d73c8b25f4d8e`.

The prior App 5B-2 workflow reused an App 4.6 APK and had no live API/Supabase topology. App 5B-2G replaces that invalid proof with an exact-commit APK, disposable local Supabase, real migrations, real Next API, and a native emulator driver. During remediation it also exposed and fixed lost capability restoration, a deprecated auth-lock warning overlay, a nonfunctional assessment retry, system-overlay recovery, and multiple unverified automation transitions.
