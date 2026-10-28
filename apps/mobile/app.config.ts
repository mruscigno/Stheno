import type { ExpoConfig } from "expo/config";

const environment = process.env.EXPO_PUBLIC_ENVIRONMENT ?? "development";
const isDevelopment = environment === "development";

const config: ExpoConfig = {
  name: isDevelopment ? "STHENO Fitness Dev" : "STHENO Fitness",
  slug: "stheno-fitness",
  scheme: isDevelopment ? "stheno-dev" : "stheno",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#fffaf3" },
  ios: {
    bundleIdentifier: isDevelopment ? "com.sthenofitness.app.dev" : "com.sthenofitness.app",
    supportsTablet: true,
    associatedDomains: ["applinks:www.sthenofitness.com"],
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: isDevelopment ? "com.sthenofitness.app.dev" : "com.sthenofitness.app",
    // Isolated staging and CI use host-forwarded HTTP services. Production
    // remains HTTPS-only.
    usesCleartextTraffic: environment !== "production",
    adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: "#fffaf3" },
    intentFilters: [{ action: "VIEW", autoVerify: true, data: [
      { scheme: "https", host: "www.sthenofitness.com", pathPrefix: "/auth/mobile" },
      { scheme: "https", host: "www.sthenofitness.com", pathPrefix: "/auth/callback" },
    ], category: ["BROWSABLE", "DEFAULT"] }],
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/icon.png" },
  plugins: [
    "expo-router",
    "./plugins/with-windows-native-build-paths",
    ["expo-secure-store", { configureAndroidBackup: true }],
    ["expo-image-picker", { photosPermission: "Allow STHENO to choose a recorded exercise clip for a private form review.", cameraPermission: "Allow STHENO to record an exercise clip for a private form review.", microphonePermission: false }],
    ["expo-splash-screen", { image: "./assets/splash.png", imageWidth: 220, backgroundColor: "#fffaf3" }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { environment },
};

export default config;
