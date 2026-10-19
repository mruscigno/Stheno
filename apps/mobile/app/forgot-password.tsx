import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Field, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { track } from "@/lib/analytics";
import { getSupabaseClient } from "@/lib/supabase";
import { spacing } from "@/theme";

export default function ForgotPasswordScreen() { const router = useRouter(); const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); async function submit() { setBusy(true); await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL("/auth/reset") }); setBusy(false); setSent(true); track("auth_reset_requested"); } return <Screen><SthenoLogo /><View style={styles.content}><Eyebrow>Account recovery</Eyebrow><Title>Reset your password.</Title><Body muted>Enter your account email. For privacy, the confirmation is the same whether or not an account exists.</Body>{sent ? <Notice tone="success">If an account exists for that address, a secure reset link is on its way.</Notice> : <><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /><Button busy={busy} disabled={!email.includes("@")} onPress={() => void submit()}>Send reset link</Button></>}<Button variant="text" onPress={() => router.back()}>Back to sign in</Button></View></Screen>; }
const styles = StyleSheet.create({ content: { flex: 1, justifyContent: "center", gap: spacing.md } });
