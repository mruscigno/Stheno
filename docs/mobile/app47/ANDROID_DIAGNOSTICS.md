# Android diagnostics

## Local bounded attempt

Windows Hypervisor Platform was available and `emulator-check accel` reported usable acceleration. A cold, wiped API 35 x86_64 AVD named `stheno_api35` was started with snapshots disabled, software graphics, 2 GB RAM, and port 5556. The device remained `offline` throughout the bounded polling window, so the attempt was stopped and all exact emulator/ADB processes were terminated.

## Hosted no-cost attempt

The public repository uses the standard free GitHub-hosted runner. The lane installs the checksum-verified debug APK on an API 35 x86_64 Pixel 6 emulator. Because the preserved APK is a debug build, Metro must be running and port 8081 must be reversed before launch.

The first hosted check installed and launched the package but displayed React Native's `Unable to load script` screen. That result was rejected. The workflow now requires the app process, captures UI XML/logcat/screenshot evidence, and fails on a missing bundle or native fatal exception.

The hardened lane added the missing development CLI, corrected the ESM/CommonJS Metro configuration mismatch, and preserved Expo's TypeScript path aliases. The final run served the real bundle, installed the exact APK, launched the STHENO process, dismissed an unrelated emulator launcher dialog, and captured unobscured STHENO UI. The isolated API was intentionally not exposed to this separate emulator job, so the app correctly rendered its assessment connection-error state.

