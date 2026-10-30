import { Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  SectionTitle,
  Title,
} from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";
import { pendingWorkoutCount } from "@/lib/workout-store";

export default function MoreScreen() {
  const auth = useAuth(),
    router = useRouter();
  async function signOut() {
    const ownerId = auth.session?.user.id,
      count = ownerId ? await pendingWorkoutCount(ownerId) : 0;
    if (count > 0) {
      Alert.alert(
        "Workout not synced",
        `${count} workout change${count === 1 ? " is" : "s are"} safely stored on this device. Sign out anyway?`,
        [
          { text: "Keep me signed in", style: "cancel" },
          {
            text: "Sign out",
            style: "destructive",
            onPress: () => void auth.signOut(),
          },
        ],
      );
      return;
    }
    await auth.signOut();
  }
  return (
    <Screen>
      <SthenoLogo />
      <Eyebrow>More</Eyebrow>
      <Title>Your account and support.</Title>
      <Card>
        <SectionTitle>
          {auth.member?.profile?.display_name || "STHENO member"}
        </SectionTitle>
        <Body muted>{auth.member?.email ?? auth.session?.user.email}</Body>
        <Body>
          {auth.status === "authenticatedOffline"
            ? "Offline workout access"
            : auth.member?.access.state.replaceAll("_", " ")}
        </Body>
      </Card>
      <Button
        variant="secondary"
        onPress={() => router.push("/(member)/nutrition")}
      >
        Nutrition
      </Button>
      <Button
        variant="secondary"
        onPress={() => router.push("/(member)/account")}
      >
        Account and preferences
      </Button>
      <Button
        variant="secondary"
        onPress={() =>
          void Linking.openURL("https://www.sthenofitness.com/exercises")
        }
      >
        Exercise library
      </Button>
      <Button
        variant="secondary"
        onPress={() =>
          void Linking.openURL("https://www.sthenofitness.com/contact")
        }
      >
        Contact support
      </Button>
      <Button
        testID="member-sign-out"
        accessibilityLabel="Sign out of member account"
        variant="text"
        onPress={() => void signOut()}
      >
        Sign out
      </Button>
    </Screen>
  );
}
