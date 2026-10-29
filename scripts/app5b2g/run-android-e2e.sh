#!/usr/bin/env bash

set -euo pipefail

capture_failure() {
  mkdir -p "$STHENO_E2E_EVIDENCE"
  adb exec-out screencap -p > "$STHENO_E2E_EVIDENCE/failure.png" 2>/dev/null || true
  adb shell uiautomator dump /sdcard/app5b2h-failure.xml >/dev/null 2>&1 || true
  adb pull /sdcard/app5b2h-failure.xml "$STHENO_E2E_EVIDENCE/failure.xml" >/dev/null 2>&1 || true
  adb logcat -d > "$STHENO_E2E_EVIDENCE/logcat.txt" 2>&1 || true
}
trap capture_failure EXIT

adb wait-for-device
test "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1"
adb reverse tcp:8081 tcp:8081
adb install -r "$STHENO_E2E_EVIDENCE/stheno-current-debug.apk" \
  | tee "$STHENO_E2E_EVIDENCE/install.txt"
adb shell am force-stop "$STHENO_ANDROID_APP_ID"
adb shell monkey -p "$STHENO_ANDROID_APP_ID" -c android.intent.category.LAUNCHER 1 \
  | tee "$STHENO_E2E_EVIDENCE/launch.txt"
sleep 20
adb logcat -c
node scripts/app5b2g/android-e2e.mjs \
  | tee "$STHENO_E2E_EVIDENCE/e2e.log"
bash scripts/app5b2g/assert-local-sqlite.sh
bash scripts/app5b2g/assert-database.sh
adb logcat -d > "$STHENO_E2E_EVIDENCE/logcat.txt"
adb shell dumpsys package "$STHENO_ANDROID_APP_ID" \
  > "$STHENO_E2E_EVIDENCE/package.txt"
! grep -Eq "FATAL EXCEPTION|AndroidRuntime.*FATAL" \
  "$STHENO_E2E_EVIDENCE/logcat.txt"
trap - EXIT
