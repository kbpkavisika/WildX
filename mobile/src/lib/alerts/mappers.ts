import type { AlertResponse, NotificationListResponse, NotificationResponse } from "@/lib/api/alerts";
import { GOOGLE_MAPS_URL } from "@/lib/constants";
import { ALERT_STATUSES, ALERT_TYPES, DISPOSITIONS, type AlertType, type Disposition } from "@/lib/enums";
import { formatAgo, formatDayTime } from "@/lib/format";
import { SEVERITY_DISPLAY } from "@/lib/incidents/mappers";
import { pendingFor } from "@/lib/outbox/overlay";
import { OUTBOX_KINDS, type OutboxRow } from "@/lib/outbox/types";
import { NO_VALUE, type ChipView, type DetailFact, type StatusView } from "@/lib/view-types";

const UNKNOWN_DEVICE = "Unknown device";
const RECENT_MS = 60 * 60 * 1000;
const RANGER_LINK_PREFIX = "/ranger";

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  [ALERT_TYPES.ZONE_BREACH]: "Zone breach",
  [ALERT_TYPES.MORTALITY]: "Mortality",
  [ALERT_TYPES.DEVICE_HEALTH]: "Device health",
  [ALERT_TYPES.HUMAN_DETECTED]: "Human detected",
};

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  [DISPOSITIONS.CONFLICT_AVERTED]: "Conflict averted",
  [DISPOSITIONS.CONFLICT_OCCURRED]: "Conflict occurred",
  [DISPOSITIONS.NO_ACTION]: "No action required",
  [DISPOSITIONS.FALSE_ALARM]: "False alarm",
};

export interface AlertRow {
  id: number;
  title: string;
  caption: string;
  severity: ChipView;
  status: StatusView;
  facts: DetailFact[];
  canAcknowledge: boolean;
  mapsUrl: string | null;
}

export interface RangerAlertsView {
  rows: AlertRow[];
  openCount: number;
  acknowledgedCount: number;
}

export interface NotificationRow {
  id: number;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  link: string | null;
}

export function withPendingAlertChanges(alert: AlertResponse, rows: OutboxRow[], userName: string): AlertResponse | null {
  if (pendingFor(rows, OUTBOX_KINDS.ALERT_RESOLVE, alert.id)) return null;
  const acknowledged = pendingFor(rows, OUTBOX_KINDS.ALERT_ACK, alert.id);
  if (!acknowledged || alert.status !== ALERT_STATUSES.OPEN) return alert;
  return { ...alert, status: ALERT_STATUSES.ACKNOWLEDGED, acknowledgedByName: userName, acknowledgedAt: new Date(acknowledged.createdAt).toISOString() };
}

function deviceLabel(alert: AlertResponse): string {
  const code = alert.collarCode ?? UNKNOWN_DEVICE;
  return alert.animalName ? `${alert.animalName} (${code})` : code;
}

function alertStatus(alert: AlertResponse): StatusView {
  if (alert.status === ALERT_STATUSES.RESOLVED) return { tone: "positive", label: "Resolved" };
  if (alert.status === ALERT_STATUSES.ACKNOWLEDGED) return { tone: "responding", label: "Acknowledged" };
  return { tone: "negative", label: alert.escalationLevel > 0 ? "Escalated" : "Open" };
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

function toAlertRow(alert: AlertResponse, now: Date): AlertRow {
  const occurred = formatDayTime(new Date(alert.occurredAt), now);
  return {
    id: alert.id,
    title: `${ALERT_TYPE_LABELS[alert.type]} · ${alert.zoneName ?? alert.collarCode ?? UNKNOWN_DEVICE}`,
    caption: `${deviceLabel(alert)} · ${occurred}`,
    severity: SEVERITY_DISPLAY[alert.severity],
    status: alertStatus(alert),
    facts: [
      { label: "Occurred", value: occurred },
      { label: "Acknowledge by", value: acknowledgeByText(alert, now) },
      { label: "Acknowledged", value: acknowledgedText(alert, now) },
    ],
    canAcknowledge: alert.status === ALERT_STATUSES.OPEN,
    mapsUrl: alert.lat !== null && alert.lng !== null ? `${GOOGLE_MAPS_URL}${alert.lat},${alert.lng}` : null,
  };
}

export function toRangerAlertsView(alerts: AlertResponse[], now: Date): RangerAlertsView {
  const active = alerts.filter((alert) => alert.status !== ALERT_STATUSES.RESOLVED);
  return {
    rows: active.map((alert) => toAlertRow(alert, now)),
    openCount: active.filter((alert) => alert.status === ALERT_STATUSES.OPEN).length,
    acknowledgedCount: active.filter((alert) => alert.status === ALERT_STATUSES.ACKNOWLEDGED).length,
  };
}

function sentText(sentAt: Date, now: Date): string {
  return now.getTime() - sentAt.getTime() < RECENT_MS ? formatAgo(sentAt, now) : formatDayTime(sentAt, now);
}

function toAppLink(link: string | null): string | null {
  if (!link?.startsWith(RANGER_LINK_PREFIX)) return null;
  return link.slice(RANGER_LINK_PREFIX.length) || "/";
}

function toNotificationRow(notification: NotificationResponse, now: Date): NotificationRow {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    time: sentText(new Date(notification.sentAt), now),
    unread: notification.readAt === null,
    link: toAppLink(notification.link),
  };
}

export function toNotificationRows(response: NotificationListResponse, now: Date): NotificationRow[] {
  return response.notifications.map((notification) => toNotificationRow(notification, now));
}
