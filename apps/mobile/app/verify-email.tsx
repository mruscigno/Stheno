import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";

export default function VerifyEmailScreen() { const router = useRouter(); return <Screen><SthenoLogo /><Eyebrow>Check your email</Eyebrow><Title>Verify, then come back.</Title><Body muted>Open the STHENO verification link on this device. Expired links return here safely without exposing credentials.</Body><Button onPress={() => router.replace("/sign-in")}>Return to sign in</Button></Screen>; }
