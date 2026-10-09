import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { AppText } from "@/components/ui/text";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationRow } from "@/lib/alerts/mappers";
import { colors, fonts, radii, sizes, space } from "@/lib/theme";

const NEW_DOT = 7;

function NewMark() {
  return (
    <View style={styles.newMark}>
      <View style={styles.newDot} />
      <AppText variant="caption" color={colors.primary}>New</AppText>
    </View>
  );
}

export function NotificationsCard() {
  const { isPending, isError, rows, unreadCount, markRead } = useNotifications();

  const open = (row: NotificationRow) => {
    if (row.unread) markRead.mutate(row.id);
    if (row.link) router.navigate(row.link as Href);
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.title}>
          <CardTitle>Notifications</CardTitle>
        </View>
        <UnreadBadge count={unreadCount} />
      </View>
      {isPending && <Notice tone="muted">Loading notifications…</Notice>}
      {isError && !rows && <Notice tone="negative">Could not load notifications. Retrying.</Notice>}
      {rows?.length === 0 && <Notice tone="muted">No notifications yet.</Notice>}
      {rows && rows.length > 0 && (
        <View style={styles.list}>
          {rows.map((row) => (
            <Pressable key={row.id} accessibilityRole="button" onPress={() => open(row)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowTitle}>
                <AppText color={row.unread ? colors.ink : colors.inkBody} style={[styles.rowTitleText, row.unread && styles.unread]}>{row.title}</AppText>
                {row.unread && <NewMark />}
              </View>
              <AppText variant="caption" color={colors.inkBody}>{row.body}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>{row.time}</AppText>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1 },
  list: { marginHorizontal: -space[3], marginTop: -space[2], gap: space[1] },
  row: { minHeight: sizes.tap, gap: 2, padding: space[3], borderRadius: radii.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  rowTitle: { flexDirection: "row", alignItems: "center", gap: space[2] },
  rowTitleText: { flex: 1 },
  unread: { fontFamily: fonts.semibold },
  newMark: { flexDirection: "row", alignItems: "center", gap: 6 },
  newDot: { width: NEW_DOT, height: NEW_DOT, borderRadius: radii.full, backgroundColor: colors.primary },
});
