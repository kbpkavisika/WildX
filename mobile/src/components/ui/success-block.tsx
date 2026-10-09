import { StyleSheet, View } from "react-native";
import { colors, radii, space } from "@/lib/theme";
import { AppText } from "./text";

export function SuccessBlock({ children }: { children: React.ReactNode }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.block}>
      <AppText color={colors.positive}>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderColor: colors.positiveLine,
    backgroundColor: colors.positiveBg,
    borderRadius: radii.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
});
