import { Pressable, StyleSheet } from "react-native";
import { StatusDot } from "@/components/ui/chip";
import { AppText } from "@/components/ui/text";
import { formatTime } from "@/lib/format";
import { pendingCount } from "@/lib/outbox/overlay";
import { useConnection, useOutbox } from "@/lib/outbox/store";
import { syncNow } from "@/lib/outbox/sync";
import { colors, sizes, space } from "@/lib/theme";

function queueText(syncing: boolean, waiting: number): string {
  if (syncing) return "Syncing…";
  return waiting > 0 ? `${waiting} waiting to sync` : "All synced";
}

export function SyncBar() {
  const online = useConnection((state) => state.online);
  const syncing = useOutbox((state) => state.syncing);
  const waiting = useOutbox((state) => pendingCount(state.rows));
  const lastSyncAt = useOutbox((state) => state.lastSyncAt);
  const lastSync = lastSyncAt === null ? "Not synced yet" : `Last sync ${formatTime(new Date(lastSyncAt))}`;
  const queue = queueText(syncing, waiting);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${online ? "Online" : "Offline"}. ${queue}. ${lastSync}.`}
      accessibilityHint={online ? "Syncs now" : undefined}
      onPress={() => online && void syncNow()}
      style={({ pressed }) => [styles.bar, pressed && online && styles.pressed]}
    >
      <StatusDot tone={online ? "positive" : "negative"} label={online ? "Online" : "Offline"} />
      <AppText variant="caption" color={colors.inkBody} style={styles.queue} numberOfLines={1}>{queue}</AppText>
      <AppText variant="caption" color={colors.inkMuted}>{lastSync}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.tap,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingHorizontal: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  queue: { flex: 1 },
});
