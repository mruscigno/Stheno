import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";

export default function OfflineScreen() { const router = useRouter(); return <Screen><SthenoLogo /><Eyebrow>Offline</Eyebrow><Title>Reconnect when you’re ready.</Title><Body muted>No private member payload is shown from an unverified session. Check your connection, then retry.</Body><Button onPress={() => router.replace("/")}>Try again</Button></Screen>; }
