#!/usr/bin/env bash

set -euo pipefail

capture_failure() {
  mkdir -p "$STHENO_E2E_EVIDENCE"
  adb exec-out screencap -p > "$STHENO_E2E_EVIDENCE/failure.png" 2>/dev/null || true
  adb shell uiautomator dump /sdcard/app5b2h-failure.xml >/dev/null 2>&1 || true
  adb pull /sdcard/app5b2h-failure.xml "$STHENO_E2E_EVIDENCE/failure.xml" >/dev/null 2>&1 || true
  adb logcat -d > "$STHENO_E2E_EVIDENCE/logcat.txt" 2>&1 || true
  adb shell dumpsys activity activities > "$STHENO_E2E_EVIDENCE/failure-activity.txt" 2>&1 || true
  adb shell dumpsys window windows > "$STHENO_E2E_EVIDENCE/failure-window.txt" 2>&1 || true
  grep -o 'content-desc="Navigation route: [^"]*"' "$STHENO_E2E_EVIDENCE/failure.xml" \
    > "$STHENO_E2E_EVIDENCE/failure-navigation.txt" 2>/dev/null || true
}
trap capture_failure ERR

adb wait-for-device
test "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1"
adb reverse tcp:8081 tcp:8081
adb install -r "$STHENO_E2E_EVIDENCE/stheno-current-debug.apk" \
  | tee "$STHENO_E2E_EVIDENCE/install.txt"
adb shell am force-stop "$STHENO_ANDROID_APP_ID"
adb shell monkey -p "$STHENO_ANDROID_APP_ID" -c android.intent.category.LAUNCHER 1 \
  | tee "$STHENO_E2E_EVIDENCE/launch.txt"
sleep 20
# Quickstep is not part of the application under test. On the headless API-35
# runner it can enter a recurring ANR loop and steal IME focus from the app.
# Stop the background launcher after STHENO is foregrounded; later app process
# restarts target the package directly and do not require the home activity.
adb shell am force-stop com.android.launcher3 || true
adb logcat -c
scenarios="${STHENO_E2E_SCENARIOS:-bootstrap,response-loss,offline-recovery,revision-conflict,account-isolation}"
printf '%s\n' "$scenarios" > "$STHENO_E2E_EVIDENCE/requested-scenarios.txt"
IFS=',' read -ra scenario_list <<< "$scenarios"
for scenario in "${scenario_list[@]}"; do
  printf '=== scenario:%s ===\n' "$scenario" | tee -a "$STHENO_E2E_EVIDENCE/e2e.log"
  node scripts/app5b2g/android-e2e.mjs "--scenario=$scenario" \
    | tee "$STHENO_E2E_EVIDENCE/scenario-$scenario.log" \
    | tee -a "$STHENO_E2E_EVIDENCE/e2e.log"
done
if [ "$scenarios" = "bootstrap,response-loss,offline-recovery,revision-conflict,account-isolation" ]; then
  bash scripts/app5b2g/assert-local-sqlite.sh
  bash scripts/app5b2g/assert-database.sh
fi
adb logcat -d > "$STHENO_E2E_EVIDENCE/logcat.txt"
adb shell dumpsys package "$STHENO_ANDROID_APP_ID" \
  > "$STHENO_E2E_EVIDENCE/package.txt"
! grep -Eq "FATAL EXCEPTION|AndroidRuntime.*FATAL" \
  "$STHENO_E2E_EVIDENCE/logcat.txt"
trap - ERR
