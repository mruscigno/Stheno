# Reproducible Android build

## Windows procedure

1. Clone the repository to a physically short path such as `C:\s46`.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm --dir apps/mobile exec expo prebuild --platform android --no-install`.
4. Set `JAVA_HOME` to Android Studio's JBR and `ANDROID_HOME` to the Android SDK.
5. From `apps/mobile/android`, run:

```powershell
.\gradlew.bat assembleDebug --no-daemon --max-workers=1 '-PreactNativeArchitectures=x86_64' '-Pkotlin.incremental=false' '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m'
```

The first successful completion took 10 minutes 21 seconds. A second completion against the same generated native tree took 2 minutes 19 seconds. Both reported 452 actionable tasks and `BUILD SUCCESSFUL`.

The short physical checkout remains necessary for Windows because some third-party native package build roots are established before the app-level staging directory is applied.
