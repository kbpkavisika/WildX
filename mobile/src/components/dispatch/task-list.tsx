import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Notice } from "@/components/ui/notice";
import { AppText } from "@/components/ui/text";
import { colors, sizes, space } from "@/lib/theme";
import type { TaskRow } from "@/lib/view-types";

const CHEVRON_SIZE = 16;

interface TaskListProps {
  title: string;
  rows: TaskRow[];
  isPending: boolean;
  isError: boolean;
  emptyText: string;
}

function TaskContent({ row }: { row: TaskRow }) {
  return (
    <>
      <View style={styles.text}>
        <AppText variant="label" numberOfLines={1}>{row.title}</AppText>
        <AppText variant="caption" color={colors.inkMuted} numberOfLines={1}>{row.caption}</AppText>
      </View>
      <Chip chip={row.status} />
    </>
  );
}

export function TaskList({ title, rows, isPending, isError, emptyText }: TaskListProps) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {isPending && rows.length === 0 && <Notice tone="muted">Loading…</Notice>}
      {isError && <Notice tone="negative">Could not load. Retrying.</Notice>}
      {!isPending && !isError && rows.length === 0 && <Notice tone="muted">{emptyText}</Notice>}
      <View>
        {rows.map((row, index) => {
          const last = index === rows.length - 1;
          const dispatchId = row.dispatchId;
          if (dispatchId === null) {
            return (
              <View key={row.key} style={[styles.item, last && styles.lastItem]}>
                <TaskContent row={row} />
              </View>
            );
          }
          return (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/dispatch/[id]", params: { id: dispatchId } })}
              style={({ pressed }) => [styles.item, last && styles.lastItem, pressed && styles.pressed]}
            >
              <TaskContent row={row} />
              <ChevronRight size={CHEVRON_SIZE} color={colors.inkMuted} strokeWidth={2} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: sizes.tap,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  lastItem: { borderBottomWidth: 0 },
  pressed: { backgroundColor: colors.surfaceMuted },
  text: { flex: 1, gap: 2 },
});
