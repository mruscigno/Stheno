# Baseline and toolchain

- Baseline commit: `e8ce7e9fbc757b7acec43a95c156a49bd5cacfb9`
- Host: Windows 11 Home, build 26200
- CPU/RAM: Intel Celeron N5095, 4 logical processors, 12 GB RAM
- Node.js: 24.19.0
- pnpm: 11.25.0
- Expo: 58.0.16
- React Native: 0.88.0
- React Native Reanimated: 4.7.1
- React Native Worklets: 0.13.0
- Java: Android Studio JBR 25.0.3
- Android SDK: API 35 and 36 images installed
- Build Tools: 37.0.0
- NDK: 27.1.12297006
- CMake/Ninja: 3.22.1 / bundled Ninja
- Target artifact ABI: x86_64

`expo install --check` reported the dependency graph up to date. One Worklets version and one Reanimated version were resolved; version skew was not the cause of the failure.
