import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { questions } from "@assessment/definition";
import { SthenoLogo } from "@/components/SthenoLogo";
import { Body, Button, Eyebrow, Notice, Title } from "@/components/Primitives";
import { Screen } from "@/components/Screen";
import { track } from "@/lib/analytics";
import { destinationForMember } from "@/lib/navigation-state";
import { useAuth } from "@/providers/AuthProvider";
import { colors, radius, spacing } from "@/theme";

const firstQuestion = questions[0]!;

export default function EntryScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { track("app_opened", { route: "/" }); }, []);
  useEffect(() => {
    if (auth.status !== "signedIn" || !auth.member) return;
    const destination = destinationForMember(auth.member);
    router.replace(destination === "today" ? "/(member)" : destination === "resume" ? "/resume" : "/membership");
  }, [auth.member, auth.status, router]);

  if (auth.status === "loading" || auth.status === "signedIn") return <Startup />;
  if (auth.status === "error") return <Screen><SthenoLogo /><View style={styles.center}><Eyebrow>Connection interrupted</Eyebrow><Title>Your account data is safe.</Title><Body muted>STHENO could not finish loading. Check your connection and try again.</Body><Button onPress={() => void auth.refresh()}>Try again</Button><Button variant="text" onPress={() => void auth.signOut()}>Return to assessment</Button></View></Screen>;

  return <Screen><View style={styles.header}><SthenoLogo /><Pressable accessibilityRole="link" accessibilityLabel="Already a member? Sign in" onPress={() => { track("existing_member_signin_clicked", { route: "/" }); router.push("/sign-in"); }}><Text style={styles.signInLink}>Already a member? Sign in</Text></Pressable></View><View style={styles.hero}><Eyebrow>Your fitness. Handled.</Eyebrow><Title>A fitness plan that changes when your life does.</Title><Body muted>Training and nutrition built around your goals, schedule, equipment, and progress.</Body></View><View style={styles.question}><Text style={styles.step}>Assessment · Question 1</Text><Text accessibilityRole="header" style={styles.questionTitle}>{firstQuestion.prompt}</Text><View style={styles.options}>{firstQuestion.options?.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: selected === option.value }} onPress={() => { setSelected(option.value); track("assessment_entry_viewed", { route: "/" }); }} style={[styles.option, selected === option.value && styles.optionSelected]}><Text style={styles.optionText}>{option.label}</Text><Text style={styles.arrow}>{selected === option.value ? "✓" : "→"}</Text></Pressable>)}</View>{selected ? <Notice>This App 2 preview does not save your answer yet. Secure assessment continuation and Blueprint generation arrive in App 3.</Notice> : <Text style={styles.help}>Choose the result that matters most. Nothing is saved on this preview screen.</Text>}</View></Screen>;
}

function Startup() { return <Screen scroll={false}><View style={styles.startup}><SthenoLogo /><Text accessibilityRole="text" style={styles.loading}>Securing your session…</Text></View></Screen>; }
const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, minWidth: 0 }, signInLink: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800", textDecorationLine: "underline", maxWidth: 126, textAlign: "right" }, center: { flex: 1, justifyContent: "center", gap: spacing.md }, startup: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg }, loading: { color: colors.muted }, hero: { paddingTop: spacing.xl, gap: spacing.sm, minWidth: 0 }, question: { marginTop: spacing.xl, gap: spacing.md, minWidth: 0 }, step: { color: colors.orangeDark, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase", fontSize: 12 }, questionTitle: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "700" }, options: { gap: spacing.sm }, option: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, backgroundColor: colors.paper, paddingHorizontal: spacing.md }, optionSelected: { borderColor: colors.orange, backgroundColor: "#fff0e9" }, optionText: { color: colors.ink, fontSize: 17, fontWeight: "600" }, arrow: { color: colors.orangeDark, fontSize: 20, fontWeight: "800" }, help: { color: colors.muted, lineHeight: 21 } });
