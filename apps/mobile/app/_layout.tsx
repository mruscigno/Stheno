import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/providers/AuthProvider";
import { colors } from "@/theme";
import { WorkoutProvider } from "@/providers/WorkoutProvider";

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><WorkoutProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.warm }, animation: "fade_from_bottom" }} /></WorkoutProvider></AuthProvider></SafeAreaProvider>;
}
