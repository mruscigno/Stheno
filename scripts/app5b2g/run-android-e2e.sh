#!/usr/bin/env bash

set -euo pipefail

adb wait-for-device
test "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1"
adb reverse tcp:8081 tcp:8081
adb install -r artifacts/app5b2g/android/stheno-current-debug.apk \
  | tee artifacts/app5b2g/android/install.txt
adb shell am force-stop "$STHENO_ANDROID_APP_ID"
adb shell monkey -p "$STHENO_ANDROID_APP_ID" -c android.intent.category.LAUNCHER 1 \
  | tee artifacts/app5b2g/android/launch.txt
sleep 20
node scripts/app5b2g/android-e2e.mjs \
  | tee artifacts/app5b2g/android/e2e.log
bash scripts/app5b2g/assert-database.sh
adb logcat -d > artifacts/app5b2g/android/logcat.txt
adb shell dumpsys package "$STHENO_ANDROID_APP_ID" \
  > artifacts/app5b2g/android/package.txt
! grep -Eq "FATAL EXCEPTION|AndroidRuntime.*FATAL" \
  artifacts/app5b2g/android/logcat.txt
