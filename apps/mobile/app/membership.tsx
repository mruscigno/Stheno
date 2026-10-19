import { Linking } from "react-native";
import { Body, Button, Eyebrow, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";

export default function MembershipScreen() { const auth = useAuth(); return <Screen><SthenoLogo /><Eyebrow>Membership</Eyebrow><Title>Your account is recognized.</Title><Body muted>Member features require an active trial or subscription. App-store billing is intentionally deferred to App 7.</Body><Notice>No access bypass or mobile purchase flow is enabled.</Notice><Button onPress={() => void Linking.openURL("https://www.sthenofitness.com/pricing")}>View options on the web</Button><Button variant="text" onPress={() => void auth.signOut()}>Sign out</Button></Screen>; }
