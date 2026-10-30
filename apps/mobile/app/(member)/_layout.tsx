import { Tabs, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/theme";
import { useWorkout } from "@/providers/WorkoutProvider";

export default function MemberLayout() {
  const router = useRouter(),
    auth = useAuth(),
    workout = useWorkout(),
    insets = useSafeAreaInsets();
  const signedOutRedirectQueued = useRef(false);
  useEffect(() => {
    if (auth.status === "signedOut") {
      if (!signedOutRedirectQueued.current) {
        signedOutRedirectQueued.current = true;
        router.replace("/");
      }
      return;
    }
    signedOutRedirectQueued.current = false;
  }, [auth.status, router]);
  if (auth.status === "signedOut") return null;
  if (auth.status !== "signedIn" && auth.status !== "authenticatedOffline")
    return null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orangeDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 7,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarButtonTestID: "member-today-tab" }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: "Plan", tabBarButtonTestID: "member-plan-tab" }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarButtonTestID: "member-progress-tab",
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarButtonTestID: "member-coach-tab",
          tabBarBadge: workout.workout?.status === "active" ? "•" : undefined,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarButtonTestID: "member-more-tab" }}
      />
      <Tabs.Screen name="nutrition" options={{ href: null }} />
      <Tabs.Screen name="adapt" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}
