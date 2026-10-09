import { StyleSheet, View } from "react-native";
import { colors, radii } from "@/lib/theme";
import type { ChipTone, ChipView, StatusTone } from "@/lib/view-types";
import { AppText } from "./text";

const CHIP_TONES: Record<ChipTone, { backgroundColor: string; borderColor: string; color: string }> = {
  positive: { backgroundColor: colors.positiveBg, borderColor: colors.positiveLine, color: colors.positive },
  negative: { backgroundColor: colors.negativeBg, borderColor: colors.negativeLine, color: colors.negative },
  neutral: { backgroundColor: colors.surfaceMuted, borderColor: colors.line, color: colors.inkBody },
  done: { backgroundColor: colors.secondarySoft, borderColor: colors.secondarySoft, color: colors.primary },
};

const STATUS_TONES: Record<StatusTone, string> = {
  positive: colors.positive,
  responding: colors.responding,
  negative: colors.negative,
};

export function Chip({ chip }: { chip: ChipView }) {
  const { color, ...tone } = CHIP_TONES[chip.tone];
  return (
    <View style={[styles.chip, tone]}>
      <AppText variant="caption" color={color}>{chip.label}</AppText>
    </View>
  );
}

export function StatusDot({ tone, label }: { tone: StatusTone; label: string }) {
  const color = STATUS_TONES[tone];
  return (
    <View style={styles.status}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption" color={color}>{label}</AppText>
    </View>
  );
}

const DOT_SIZE = 7;

const styles = StyleSheet.create({
  chip: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radii.xs, paddingVertical: 2, paddingHorizontal: 6 },
  status: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: radii.full },
});
