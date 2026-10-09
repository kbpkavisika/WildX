import type { AlertReportResponse, AlertReportRowResponse } from "@/lib/api/alert-report";
import { ALERT_TYPE_LABELS } from "./mappers";
import type { AlertReportRow, AlertReportView } from "./report-types";

const MINUTES_PER_HOUR = 60;
const NO_VALUE = "—";

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return NO_VALUE;
  if (minutes < MINUTES_PER_HOUR) return `${minutes.toFixed(1)} min`;
  return `${(minutes / MINUTES_PER_HOUR).toFixed(1)} h`;
}

function toRow(row: AlertReportRowResponse): AlertReportRow {
  return {
    key: `${row.type}-${row.zoneId ?? "none"}`,
    type: ALERT_TYPE_LABELS[row.type],
    zone: row.zoneName ?? "No zone",
    hasZone: row.zoneName !== null,
    count: row.count,
    acknowledge: formatMinutes(row.medianAcknowledgeMinutes),
    resolve: formatMinutes(row.medianResolveMinutes),
  };
}

export function toAlertReportView(report: AlertReportResponse): AlertReportView {
  return {
    total: report.total,
    metrics: [
      { label: "Alerts raised", value: String(report.total) },
      { label: "Median time to acknowledge", value: formatMinutes(report.medianAcknowledgeMinutes) },
      { label: "Median time to resolve", value: formatMinutes(report.medianResolveMinutes) },
    ],
    rows: report.rows.map(toRow),
  };
}
