# Android toolchain and build

Installed and verified:

- Android Studio 2026.2.1.8
- Android SDK platform-tools 37.0.1
- Android emulator 37.2.12
- Android 35 and 36 Google APIs x86_64 system images
- Android build-tools 36.0.0 and 37.0.0
- Android platforms 35, 36, and 37
- NDK 27.1.12297006 and CMake 3.22.1
- Android licenses accepted
- Windows Hypervisor Platform reported usable by `emulator-check accel`

AVDs `stheno_api36` (Pixel 6) and `stheno_api35` (Pixel 5) both started QEMU but remained `offline` in ADB and never reported `sys.boot_completed=1`. Software and ANGLE graphics attempts produced the same result.

`expo prebuild --platform android --no-install` generated the native project successfully. The initial Gradle build reached 152 tasks before two worker daemons timed out under host load. A single-worker retry passed those Java tasks and reached native compilation, then failed in `react-native-worklets` with `ninja: error: manifest 'build.ninja' still dirty after 100 tries`. No APK was produced. The generated native directory was removed after evidence collection because this remains a managed Expo project.
