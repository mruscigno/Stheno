import { Body, Button, Card, Eyebrow, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { useAuth } from "@/providers/AuthProvider";

export default function MoreScreen() { const auth = useAuth(); return <Screen><SthenoLogo /><Eyebrow>Account</Eyebrow><Title>More control, less clutter.</Title><Card><Body>{auth.member?.email ?? "Signed-in member"}</Body><Body muted>Session credentials are stored in the device secure store.</Body></Card><Button variant="secondary" onPress={() => void auth.signOut()}>Sign out</Button></Screen>; }
