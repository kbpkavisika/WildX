import { StyleSheet, View } from "react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { AppText } from "./text";

const BADGE_HEIGHT = 22;

export function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View accessibilityLabel={`${count} unread`} style={styles.badge}>
      <AppText variant="caption" color={colors.onPrimary} style={styles.text}>{count}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: BADGE_HEIGHT,
    minWidth: BADGE_HEIGHT,
    borderRadius: radii.full,
    backgroundColor: colors.tertiary,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontFamily: fonts.semibold },
});
