import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Chip } from "@/components/ui/chip";
import { AppText } from "@/components/ui/text";
import type { RangerPatrolCard } from "@/lib/patrols/mappers";
import { colors, radii, sizes, space } from "@/lib/theme";

export function RangerPatrolList({ cards }: { cards: RangerPatrolCard[] }) {
  return (
    <View style={styles.list}>
      {cards.map((card) => (
        <Pressable
          key={card.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/patrol/[id]", params: { id: card.id } })}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.titleRow}>
            <AppText variant="label" style={styles.title}>{card.title}</AppText>
            <Chip chip={card.status} />
          </View>
          <AppText variant="caption" color={colors.inkMuted}>{card.caption}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[3] },
  card: {
    minHeight: sizes.tap,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: space[4],
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space[3] },
  title: { flex: 1 },
});
