import type { AlertResponse } from "@/lib/api/alerts";
import type { ZoneResponse } from "@/lib/api/zones";
import { ALERT_STATUSES, ALERT_TYPES, DISPOSITIONS, type AlertType, type Disposition, type Role } from "@/lib/enums";
import { GOOGLE_MAPS_URL } from "@/lib/constants";
import { formatDayTime } from "@/lib/format";
import { SEVERITY_DISPLAY } from "@/lib/incidents/mappers";
import { can } from "@/lib/auth/permissions";
import { toSectorShape } from "@/lib/patrols/mappers";
import type { LatLng } from "@/lib/patrols/types";
import type { DetailFact } from "@/lib/incidents/types";
import {
  ALERT_FILTERS,
  type AlertDetailView,
  type AlertFilter,
  type AlertFilterOption,
  type AlertRow,
  type AlertStatusView,
  type AlertsView,
  type RangerAlertDetail,
  type RangerAlertsView,
} from "./types";

const UNKNOWN_DEVICE = "Unknown device";
const NO_VALUE = "—";
const ACTIVE_STATUSES = new Set<string>([ALERT_STATUSES.OPEN, ALERT_STATUSES.ACKNOWLEDGED]);

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
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

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  [DISPOSITIONS.CONFLICT_AVERTED]: "Conflict averted",
  [DISPOSITIONS.CONFLICT_OCCURRED]: "Conflict occurred",
  [DISPOSITIONS.NO_ACTION]: "No action required",
  [DISPOSITIONS.FALSE_ALARM]: "False alarm",
};

export const EMPTY_ALERTS: AlertsView = { rows: [], filters: [], zones: [], selected: null, openCount: 0, escalatedCount: 0 };

function isEscalated(alert: AlertResponse): boolean {
  return alert.status === ALERT_STATUSES.OPEN && alert.escalationLevel > 0;
}

function deviceLabel(alert: AlertResponse): string {
  const code = alert.collarCode ?? UNKNOWN_DEVICE;
  return alert.animalName ? `${alert.animalName} (${code})` : code;
}

function alertTitle(alert: AlertResponse): string {
  return `${ALERT_TYPE_LABELS[alert.type]} · ${alert.zoneName ?? alert.collarCode ?? UNKNOWN_DEVICE}`;
}

function alertStatus(alert: AlertResponse): AlertStatusView {
  if (alert.status === ALERT_STATUSES.RESOLVED) return { tone: "positive", label: "Resolved" };
  if (alert.status === ALERT_STATUSES.ACKNOWLEDGED) return { tone: "responding", label: "Acknowledged" };
  return { tone: "negative", label: isEscalated(alert) ? "Escalated" : "Open" };
}

function positionOf(alert: AlertResponse): LatLng | null {
  return alert.lat !== null && alert.lng !== null ? [alert.lat, alert.lng] : null;
}

function escalationText(level: number): string {
  if (level === 0) return "Not escalated";
  return level === 1 ? "Escalated 1 time" : `Escalated ${level} times`;
}

function acknowledgeByText(alert: AlertResponse, now: Date): string {
  if (alert.status !== ALERT_STATUSES.OPEN || !alert.slaDueAt) return NO_VALUE;
  const due = new Date(alert.slaDueAt);
  return due < now ? `${formatDayTime(due, now)} · overdue` : formatDayTime(due, now);
}

function acknowledgedText(alert: AlertResponse, now: Date): string {
  if (!alert.acknowledgedAt) return NO_VALUE;
  const time = formatDayTime(new Date(alert.acknowledgedAt), now);
  return alert.acknowledgedByName ? `${alert.acknowledgedByName} · ${time}` : time;
}

function resolvedText(alert: AlertResponse, now: Date): string {
  if (!alert.resolvedAt) return NO_VALUE;
  const time = formatDayTime(new Date(alert.resolvedAt), now);
  return alert.disposition ? `${time} · ${DISPOSITION_LABELS[alert.disposition]}` : time;
}

function alertFacts(alert: AlertResponse, now: Date): DetailFact[] {
  return [
    { label: "Device", value: deviceLabel(alert) },
    { label: "Occurred", value: formatDayTime(new Date(alert.occurredAt), now) },
    { label: "Acknowledge by", value: acknowledgeByText(alert, now) },
    { label: "Escalation", value: escalationText(alert.escalationLevel) },
    { label: "Acknowledged", value: acknowledgedText(alert, now) },
    { label: "Resolved", value: resolvedText(alert, now) },
  ];
}

function isHandler(role: Role | null): boolean {
  return can(role, "alert.handle");
}

function toAlertDetail(alert: AlertResponse, role: Role | null, now: Date): AlertDetailView {
  const handler = isHandler(role);
  const unresolved = alert.status !== ALERT_STATUSES.RESOLVED;
  return {
    id: alert.id,
    title: alertTitle(alert),
    severity: SEVERITY_DISPLAY[alert.severity],
    status: alertStatus(alert),
    facts: alertFacts(alert, now),
    position: positionOf(alert),
    canAcknowledge: handler && alert.status === ALERT_STATUSES.OPEN,
    canResolve: handler && unresolved,
    canDispatch: can(role, "alert.dispatch") && unresolved,
    cameraImageId: can(role, "image.view") ? alert.cameraImageId : null,
  };
}

function toAlertRow(alert: AlertResponse, index: number, now: Date): AlertRow {
  return {
    id: alert.id,
    number: index + 1,
    title: alertTitle(alert),
    caption: `${deviceLabel(alert)} · ${formatDayTime(new Date(alert.occurredAt), now)}`,
    severity: SEVERITY_DISPLAY[alert.severity],
    status: alertStatus(alert),
    position: positionOf(alert),
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
  selectedId: number | null,
  role: Role | null,
  now: Date,
): AlertsView {
  const selected = alerts.find((alert) => alert.id === selectedId);
  return {
    rows: alerts.filter((alert) => matches(alert, filter)).map((alert, index) => toAlertRow(alert, index, now)),
    filters: filterOptions(alerts),
    zones: zones.flatMap((zone) => toSectorShape(zone) ?? []),
    selected: selected ? toAlertDetail(selected, role, now) : null,
    openCount: alerts.filter((alert) => alert.status === ALERT_STATUSES.OPEN).length,
    escalatedCount: alerts.filter(isEscalated).length,
  };
}

function toRangerDetail(alert: AlertResponse, role: Role | null, now: Date): RangerAlertDetail {
  const position = positionOf(alert);
  return {
    id: alert.id,
    facts: [
      { label: "Occurred", value: formatDayTime(new Date(alert.occurredAt), now) },
      { label: "Acknowledge by", value: acknowledgeByText(alert, now) },
      { label: "Acknowledged", value: acknowledgedText(alert, now) },
    ],
    canAcknowledge: isHandler(role) && alert.status === ALERT_STATUSES.OPEN,
    canResolve: isHandler(role),
    mapsUrl: position ? `${GOOGLE_MAPS_URL}${position[0]},${position[1]}` : null,
  };
}

export function toRangerAlertsView(alerts: AlertResponse[], selectedId: number | null, role: Role | null, now: Date): RangerAlertsView {
  const active = alerts.filter((alert) => ACTIVE_STATUSES.has(alert.status));
  const selected = active.find((alert) => alert.id === selectedId);
  return {
    rows: active.map((alert, index) => toAlertRow(alert, index, now)),
    selected: selected ? toRangerDetail(selected, role, now) : null,
    openCount: active.filter((alert) => alert.status === ALERT_STATUSES.OPEN).length,
    acknowledgedCount: active.filter((alert) => alert.status === ALERT_STATUSES.ACKNOWLEDGED).length,
  };
}
