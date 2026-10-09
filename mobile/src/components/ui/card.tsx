import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radii, space } from "@/lib/theme";
import { AppText } from "./text";

const CARD_GAP = 18;

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <AppText variant="cardTitle" accessibilityRole="header">{children}</AppText>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: space[4],
    gap: CARD_GAP,
  },
});
