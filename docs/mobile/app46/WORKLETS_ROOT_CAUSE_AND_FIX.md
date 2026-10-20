# Worklets root cause and fix

## Root cause

The App 4.5 failure was a Windows path-length failure, not a dependency incompatibility. In the normal repository location, Worklets' CMake object directory reached CMake's 250-character safety limit and Ninja repeatedly regenerated `build.ninja`. A mapped drive did not help because pnpm links resolved to the original physical `.pnpm` path.

A physical short checkout removed the regeneration loop but exposed two remaining overlong paths:

1. pnpm's isolated virtual-store path inside `react-native-worklets`;
2. the app-level New Architecture codegen object path for Gesture Handler (272 characters).

## Fix

- `nodeLinker: hoisted` removes the long pnpm virtual-store segment from native package source paths.
- The Expo config plugin writes a Windows-only CMake staging directory, defaulting to `C:/stheno-cmake` and overrideable with `STHENO_CMAKE_STAGING_DIR`.
- The plugin passes `-DCMAKE_OBJECT_PATH_MAX=180` so CMake detects unsafe object paths early.
- Native dependency versions and New Architecture behavior remain unchanged.

Worklets, Reanimated, app codegen, Expo Modules Core, Gesture Handler, and Screens all completed native compilation after the fix.
