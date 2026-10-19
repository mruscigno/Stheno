import type { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";

export function Screen({ children, footer, scroll = true }: PropsWithChildren<{ footer?: ReactNode; scroll?: boolean }>) {
  const content = <View style={styles.content}>{children}</View>;
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}{footer ? <View style={styles.footer}>{footer}</View> : null}</KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.warm }, flex: { flex: 1, minWidth: 0 }, scroll: { flexGrow: 1, minWidth: 0 }, content: { width: "100%", maxWidth: 720, minWidth: 0, boxSizing: "border-box", alignSelf: "center", padding: spacing.lg, flex: 1 }, footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.warm } });
