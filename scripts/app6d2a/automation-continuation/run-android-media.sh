#!/usr/bin/env bash
set -euo pipefail

evidence="${STHENO_MEDIA_EVIDENCE:?missing evidence directory}"
app_id="${STHENO_ANDROID_APP_ID:?missing Android app id}"
mkdir -p "$evidence"

capture_failure() {
  adb exec-out screencap -p > "$evidence/failure.png" 2>/dev/null || true
  adb shell uiautomator dump /sdcard/app6d2a-failure.xml >/dev/null 2>&1 || true
  adb pull /sdcard/app6d2a-failure.xml "$evidence/failure.xml" >/dev/null 2>&1 || true
  adb logcat -d > "$evidence/logcat.txt" 2>&1 || true
  adb shell dumpsys activity activities > "$evidence/activity.txt" 2>&1 || true
  adb shell dumpsys window windows > "$evidence/window.txt" 2>&1 || true
}
trap capture_failure ERR

adb wait-for-device
test "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1"
adb reverse tcp:8081 tcp:8081
adb install -r "$evidence/stheno-current-debug.apk" | tee "$evidence/install.txt"
adb shell am force-stop "$app_id"
adb shell am start -W -a android.intent.action.VIEW \
  -d "stheno://exercise/barbell-bench-press" "$app_id" | tee "$evidence/deep-link-launch.txt"

found="false"
for attempt in $(seq 1 60); do
  adb shell uiautomator dump --compressed /sdcard/app6d2a.xml >/dev/null 2>&1 || true
  adb pull /sdcard/app6d2a.xml "$evidence/exercise-guide.xml" >/dev/null 2>&1 || true
  if grep -q 'exercise-guide-media' "$evidence/exercise-guide.xml" \
    && grep -q 'Reviewed purchased demonstration' "$evidence/exercise-guide.xml"; then
    found="true"
    break
  fi
  sleep 2
done
test "$found" = "true"

adb exec-out screencap -p > "$evidence/android-exercise-before-play.png"

node --input-type=module - "$evidence/exercise-guide.xml" <<'NODE' > "$evidence/media-center.txt"
import { readFileSync } from "node:fs";
const xml = readFileSync(process.argv[2], "utf8");
const node = xml.match(/<node[^>]*resource-id="[^"]*exercise-guide-media"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*>/);
if (!node) throw new Error("exercise-guide-media bounds unavailable");
console.log(`${Math.round((Number(node[1]) + Number(node[3])) / 2)} ${Math.round((Number(node[2]) + Number(node[4])) / 2)}`);
NODE
read -r media_x media_y < "$evidence/media-center.txt"
adb shell input tap "$media_x" "$media_y"
sleep 2
adb exec-out screencap -p > "$evidence/android-exercise-playing-a.png"
sleep 2
adb exec-out screencap -p > "$evidence/android-exercise-playing-b.png"

hash_a="$(sha256sum "$evidence/android-exercise-playing-a.png" | awk '{print $1}')"
hash_b="$(sha256sum "$evidence/android-exercise-playing-b.png" | awk '{print $1}')"
test "$hash_a" != "$hash_b"
printf 'frame_a_sha256=%s\nframe_b_sha256=%s\nplayback_frames_changed=true\n' "$hash_a" "$hash_b" \
  > "$evidence/playback-proof.txt"

adb logcat -d > "$evidence/logcat.txt"
adb shell dumpsys activity activities > "$evidence/activity.txt"
adb shell dumpsys window windows > "$evidence/window.txt"
! grep -Eq 'FATAL EXCEPTION|AndroidRuntime.*FATAL' "$evidence/logcat.txt"
printf 'ANDROID_MEDIA_PLAYBACK_PASS\n' | tee "$evidence/pass-marker.txt"
trap - ERR
