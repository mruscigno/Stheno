import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Field, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { SthenoLogo } from "@/components/SthenoLogo";
import { getSupabaseClient } from "@/lib/supabase";
import { spacing } from "@/theme";

export default function ResetPasswordScreen() { const router = useRouter(); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null); async function save() { if (password.length < 10 || password !== confirm) { setMessage("Use at least 10 characters and make both entries match."); return; } setBusy(true); const { error } = await getSupabaseClient().auth.updateUser({ password }); setBusy(false); if (error) { setMessage("The recovery session expired. Request a new reset link."); return; } router.replace("/"); } return <Screen><SthenoLogo /><View style={styles.content}><Eyebrow>Choose a new password</Eyebrow><Title>Secure your account.</Title><Body muted>The reset link establishes a short-lived recovery session before a password can be changed.</Body>{message ? <Notice tone="error">{message}</Notice> : null}<Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" /><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" /><Button busy={busy} onPress={() => void save()}>Save password</Button></View></Screen>; }
const styles = StyleSheet.create({ content: { flex: 1, justifyContent: "center", gap: spacing.md } });
