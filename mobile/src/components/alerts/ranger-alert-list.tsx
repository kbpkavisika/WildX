import { Map as MapIcon } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip, StatusDot } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { Notice } from "@/components/ui/notice";
import { AppText } from "@/components/ui/text";
import type { AlertRow, RangerAlertsView } from "@/lib/alerts/mappers";
import { useAlertsPage } from "@/lib/alerts/store";
import type { Disposition } from "@/lib/enums";
import { colors, radii, sizes, space } from "@/lib/theme";
import { ResolveForm } from "./resolve-form";

interface AlertActions {
  acknowledge: (id: number) => void;
  resolve: (id: number, disposition: Disposition) => void;
}

function RangerActions({ row, actions }: { row: AlertRow; actions: AlertActions }) {
  const { resolving, setResolving } = useAlertsPage();

  if (resolving) {
    return <ResolveForm onSubmit={(disposition) => actions.resolve(row.id, disposition)} onCancel={() => setResolving(false)} />;
  }

  const mapsUrl = row.mapsUrl;
  return (
    <View style={styles.actions}>
      {row.canAcknowledge && <Button label="Acknowledge" onPress={() => actions.acknowledge(row.id)} />}
      <SecondaryButton label="Resolve" onPress={() => setResolving(true)} />
      {mapsUrl && <SecondaryButton label="Open in maps" icon={MapIcon} onPress={() => void Linking.openURL(mapsUrl)} />}
    </View>
  );
}

function RangerAlertItem({ row, open, actions }: { row: AlertRow; open: boolean; actions: AlertActions }) {
  const toggle = useAlertsPage((state) => state.toggle);
  return (
    <View style={[styles.item, open && styles.itemOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => toggle(row.id)}
        style={({ pressed }) => [styles.row, pressed && !open && styles.pressed]}
      >
        <AppText variant="label">{row.title}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{row.caption}</AppText>
        <View style={styles.meta}>
          <Chip chip={row.severity} />
          <StatusDot tone={row.status.tone} label={row.status.label} />
        </View>
      </Pressable>
      {open && (
        <View style={styles.detail}>
          <FactList facts={row.facts} />
          <RangerActions row={row} actions={actions} />
        </View>
      )}
    </View>
  );
}

export function RangerAlertList({ view, error, actions }: { view: RangerAlertsView; error: string | null; actions: AlertActions }) {
  const selectedId = useAlertsPage((state) => state.selectedId);
  const notice = useAlertsPage((state) => state.notice);

  return (
    <Card>
      <CardTitle>Open alerts</CardTitle>
      {notice && <Notice tone="positive">{notice}</Notice>}
      {error && <Notice tone="negative">{error}</Notice>}
      {view.rows.length === 0 ? (
        <Notice tone="muted">No open alerts. You will be notified when one is raised.</Notice>
      ) : (
        <View style={styles.list}>
          {view.rows.map((row) => (
            <RangerAlertItem key={row.id} row={row} open={row.id === selectedId} actions={actions} />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -space[2], gap: space[1] },
  item: { borderRadius: radii.md },
  itemOpen: { backgroundColor: colors.surfaceSunken },
  row: { minHeight: sizes.tap, gap: 6, padding: space[3], borderRadius: radii.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  meta: { flexDirection: "row", alignItems: "center", gap: 10 },
  detail: { gap: 14, paddingHorizontal: space[3], paddingBottom: space[3], paddingTop: space[1] },
  actions: { gap: space[3] },
});
