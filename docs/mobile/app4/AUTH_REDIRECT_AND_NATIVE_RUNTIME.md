# Auth, redirects, and native runtime

The App 2 secure-store session lifecycle and App 3 account-claim redirect remain unchanged. Every API call obtains the current access token at request time. Logout clears all in-memory models and the user-scoped secure cache.

Android runtime capture was attempted on Windows, but `adb`, `emulator`, Java, `ANDROID_HOME`, and `ANDROID_SDK_ROOT` are unavailable. iOS runtime execution is unavailable on Windows. Expo web export is the available compilation proxy and passes.
