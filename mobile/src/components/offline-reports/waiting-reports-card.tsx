import { StyleSheet, View } from "react-native";
import { SecondaryButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { AppText } from "@/components/ui/text";
import { formatTime } from "@/lib/format";
import { OFFLINE_STATUSES, type OfflineReport } from "@/lib/offline-reports/repository";
import { discardReport } from "@/lib/offline-reports/sender";
import { useOfflineReports } from "@/lib/offline-reports/store";
import { colors, sizes, space } from "@/lib/theme";
import type { ChipView } from "@/lib/view-types";

const WAITING_CHIP: ChipView = { tone: "neutral", label: "Waiting" };
const REJECTED_CHIP: ChipView = { tone: "negative", label: "Not accepted" };

function WaitingReportRow({ report, last }: { report: OfflineReport; last: boolean }) {
  const rejected = report.status === OFFLINE_STATUSES.REJECTED;
  return (
    <View style={[styles.item, last && styles.lastItem]}>
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="label" numberOfLines={1}>{report.typeName}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Saved {formatTime(new Date(report.createdAt))}</AppText>
        </View>
        <Chip chip={rejected ? REJECTED_CHIP : WAITING_CHIP} />
      </View>
      {rejected && (
        <>
          <AppText variant="caption" color={colors.negative}>{report.error}</AppText>
          <SecondaryButton label="Discard" onPress={() => discardReport(report)} />
        </>
      )}
    </View>
  );
}

export function WaitingReportsCard() {
  const reports = useOfflineReports((state) => state.reports);
  if (reports.length === 0) return null;

  return (
    <Card>
      <CardTitle>{`Waiting to send (${reports.length})`}</CardTitle>
      <View>
        {reports.map((report, index) => (
          <WaitingReportRow key={report.id} report={report} last={index === reports.length - 1} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: space[2],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  lastItem: { borderBottomWidth: 0 },
  row: { minHeight: sizes.tap, flexDirection: "row", alignItems: "center", gap: space[3] },
  text: { flex: 1, gap: 2 },
});
