import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/providers/AuthProvider";
import { colors } from "@/theme";
import { WorkoutProvider } from "@/providers/WorkoutProvider";

function NavigationDiagnostics() {
  const pathname = usePathname();
  if (process.env.EXPO_PUBLIC_NATIVE_JOURNEY_DIAGNOSTICS !== "true")
    return null;
  return (
    <Text
      testID="navigation-state"
      accessibilityLabel={`Navigation route: ${pathname}`}
      style={styles.navigationDiagnostic}
    >
      {pathname}
    </Text>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkoutProvider>
          <StatusBar style="dark" />
          <NavigationDiagnostics />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.warm },
              animation: "fade_from_bottom",
            }}
          />
        </WorkoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  navigationDiagnostic: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0.01,
  },
});
