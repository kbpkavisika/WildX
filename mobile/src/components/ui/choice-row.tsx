import { Pressable, StyleSheet, View } from "react-native";
import { colors, radii, sizes, space } from "@/lib/theme";
import { AppText } from "./text";

const RADIO_SIZE = 16;
const RADIO_DOT = 8;
const RING_WIDTH = 3;

interface ChoiceRowProps {
  label: string;
  caption?: string;
  checked: boolean;
  onPress: () => void;
}

export function ChoiceRow({ label, caption, checked, onPress }: ChoiceRowProps) {
  return (
    <View style={[styles.ring, checked && styles.ringChecked]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked }}
        onPress={onPress}
        style={({ pressed }) => [styles.row, checked && styles.rowChecked, pressed && styles.rowPressed]}
      >
        <View style={[styles.radio, checked && styles.radioChecked]}>{checked && <View style={styles.radioDot} />}</View>
        <View style={styles.text}>
          <AppText>{label}</AppText>
          {caption && <AppText variant="caption" color={colors.inkMuted}>{caption}</AppText>}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { margin: -RING_WIDTH, borderWidth: RING_WIDTH, borderColor: "transparent", borderRadius: radii.field + RING_WIDTH },
  ringChecked: { borderColor: colors.secondarySoft },
  row: {
    minHeight: sizes.tap,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.field,
    backgroundColor: colors.surface,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  rowChecked: { borderColor: colors.primary },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioChecked: { borderColor: colors.primary },
  radioDot: { width: RADIO_DOT, height: RADIO_DOT, borderRadius: radii.full, backgroundColor: colors.primary },
  text: { flex: 1, gap: 2 },
});
