import type { AlertResponse } from "@/lib/api/alerts";
import type { ZoneResponse } from "@/lib/api/zones";
import { ALERT_STATUSES, ALERT_TYPES, type AlertType } from "@/lib/enums";
import { formatDayTime } from "@/lib/format";
import { SEVERITY_DISPLAY } from "@/lib/incidents/mappers";
import { toSectorShape } from "@/lib/patrols/mappers";
import { ALERT_FILTERS, type AlertFilter, type AlertFilterOption, type AlertRow, type AlertStatusView, type AlertsView } from "./types";

const UNKNOWN_DEVICE = "Unknown device";

const TYPE_LABELS: Record<AlertType, string> = {
  [ALERT_TYPES.ZONE_BREACH]: "Zone breach",
  [ALERT_TYPES.MORTALITY]: "Mortality",
  [ALERT_TYPES.DEVICE_HEALTH]: "Device health",
  [ALERT_TYPES.HUMAN_DETECTED]: "Human detected",
};

const FILTER_LABELS: Record<AlertFilter, string> = {
  [ALERT_FILTERS.OPEN]: "Open",
  [ALERT_FILTERS.ACKNOWLEDGED]: "Acknowledged",
  [ALERT_FILTERS.RESOLVED]: "Resolved",
  [ALERT_FILTERS.ALL]: "All",
};

export const EMPTY_ALERTS: AlertsView = { rows: [], filters: [], zones: [], openCount: 0, escalatedCount: 0 };

function isEscalated(alert: AlertResponse): boolean {
  return alert.status === ALERT_STATUSES.OPEN && alert.escalationLevel > 0;
}

function deviceLabel(alert: AlertResponse): string {
  const code = alert.collarCode ?? UNKNOWN_DEVICE;
  return alert.animalName ? `${alert.animalName} (${code})` : code;
}

function alertTitle(alert: AlertResponse): string {
  return `${TYPE_LABELS[alert.type]} · ${alert.zoneName ?? alert.collarCode ?? UNKNOWN_DEVICE}`;
}

function alertStatus(alert: AlertResponse): AlertStatusView {
  if (alert.status === ALERT_STATUSES.RESOLVED) return { tone: "positive", label: "Resolved" };
  if (alert.status === ALERT_STATUSES.ACKNOWLEDGED) return { tone: "responding", label: "Acknowledged" };
  return { tone: "negative", label: isEscalated(alert) ? "Escalated" : "Open" };
}

function toAlertRow(alert: AlertResponse, index: number, now: Date): AlertRow {
  return {
    id: alert.id,
    number: index + 1,
    title: alertTitle(alert),
    caption: `${deviceLabel(alert)} · ${formatDayTime(new Date(alert.occurredAt), now)}`,
    severity: SEVERITY_DISPLAY[alert.severity],
    status: alertStatus(alert),
    position: alert.lat !== null && alert.lng !== null ? [alert.lat, alert.lng] : null,
  };
}

function matches(alert: AlertResponse, filter: AlertFilter): boolean {
  return filter === ALERT_FILTERS.ALL || alert.status === filter;
}

function filterOptions(alerts: AlertResponse[]): AlertFilterOption[] {
  return Object.values(ALERT_FILTERS).map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: alerts.filter((alert) => matches(alert, value)).length,
  }));
}

export function toAlertsView(
  alerts: AlertResponse[],
  zones: ZoneResponse[],
  filter: AlertFilter,
  now: Date,
): AlertsView {
  return {
    rows: alerts.filter((alert) => matches(alert, filter)).map((alert, index) => toAlertRow(alert, index, now)),
    filters: filterOptions(alerts),
    zones: zones.flatMap((zone) => toSectorShape(zone) ?? []),
    openCount: alerts.filter((alert) => alert.status === ALERT_STATUSES.OPEN).length,
    escalatedCount: alerts.filter(isEscalated).length,
  };
}
