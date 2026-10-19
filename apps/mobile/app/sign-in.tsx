import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Body, Button, Eyebrow, Field, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { track } from "@/lib/analytics";
import { getSupabaseClient } from "@/lib/supabase";
import { loadCapability } from "@/lib/anonymous-assessment";
import { colors, spacing } from "@/theme";

export default function SignInScreen() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function submit() { setBusy(true); setMessage(null); const { error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim(), password }); setBusy(false); if (error) { const category = error.status === 429 ? "rate_limited" : error.status === 400 ? "invalid_credentials" : "service"; track("auth_login_failure", { category }); setMessage(category === "rate_limited" ? "Too many attempts. Wait a moment and try again." : "That email and password combination was not accepted."); return; } track("auth_login_success"); router.replace((await loadCapability()) ? "/blueprint" : "/"); }
  return <Screen><SthenoLogo /><View style={styles.content}><Eyebrow>Welcome back</Eyebrow><Title>Sign in to STHENO.</Title><Body muted>Your secure session will be stored in the device keychain or Android Keystore.</Body>{message ? <Notice tone="error">{message}</Notice> : null}<Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!visible} autoComplete="current-password" returnKeyType="go" onSubmitEditing={() => void submit()} /><Button variant="text" onPress={() => setVisible((value) => !value)}>{visible ? "Hide password" : "Show password"}</Button><Button busy={busy} disabled={!email.trim() || password.length < 6} onPress={() => void submit()}>Sign in</Button><Link href="/forgot-password" style={styles.link}>Forgot password?</Link><Button variant="text" onPress={() => router.replace("/")}>Back to assessment</Button></View></Screen>;
}
const styles = StyleSheet.create({ content: { flex: 1, justifyContent: "center", gap: spacing.md, paddingVertical: spacing.xl }, link: { color: colors.orangeDark, textAlign: "center", minHeight: 44, paddingTop: spacing.md, fontWeight: "700" } });
