import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export function SthenoLogo({ compact = false }: { compact?: boolean }) {
  return <View accessibilityRole="image" accessibilityLabel="STHENO Fitness" style={styles.frame}><Image source={compact ? require("../../assets/stheno-mark-orange.svg") : require("../../assets/stheno-logo-orange.svg")} contentFit="contain" style={compact ? styles.mark : styles.logo} /></View>;
}
const styles = StyleSheet.create({ frame: { alignSelf: "flex-start", flexShrink: 1 }, logo: { width: 196, height: 52, maxWidth: "100%" }, mark: { width: 48, height: 48 } });
