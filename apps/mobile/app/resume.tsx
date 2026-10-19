import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";

export default function ResumeScreen() { const router = useRouter(); const auth = useAuth(); return <Screen><SthenoLogo /><Eyebrow>Assessment in progress</Eyebrow><Title>Your plan needs the rest of your context.</Title><Body muted>Your account indicates an incomplete assessment. App 3 will add secure resume and Blueprint generation; App 2 does not invent or discard answers.</Body><Notice>No assessment data is collected on this placeholder.</Notice><Button onPress={() => router.replace("/")}>View assessment entry</Button><Button variant="text" onPress={() => void auth.signOut()}>Sign out</Button></Screen>; }
