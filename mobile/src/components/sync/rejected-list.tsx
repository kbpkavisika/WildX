import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SecondaryButton } from "@/components/ui/button";
import { NegativeBanner } from "@/components/ui/notice";
import { rejectedGroups } from "@/lib/outbox/overlay";
import { useOutbox } from "@/lib/outbox/store";
import { discardRows } from "@/lib/outbox/sync";
import { space } from "@/lib/theme";

export function RejectedList() {
  const rows = useOutbox((state) => state.rows);
  const groups = useMemo(() => rejectedGroups(rows), [rows]);
  if (groups.length === 0) return null;

  return (
    <View style={styles.list}>
      {groups.map((group) => (
        <NegativeBanner key={group.key} title={`Not accepted: ${group.title}`} caption={group.error}>
          <SecondaryButton label="Discard" onPress={() => discardRows(group.rows)} />
        </NegativeBanner>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[2], margin: space[4], marginBottom: 0 },
});
