import { z } from "zod";
import { ALERT_STATUSES, ALERT_TYPES, SEVERITIES, type Disposition } from "@/lib/enums";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

const alertSchema = z.object({
  id: z.number(),
  type: z.enum(ALERT_TYPES),
  severity: z.enum(SEVERITIES),
  status: z.enum(ALERT_STATUSES),
  collarCode: z.string().nullable(),
  animalName: z.string().nullable(),
  zoneName: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  occurredAt: timestamp,
  slaDueAt: timestamp.nullable(),
  acknowledgedByName: z.string().nullable(),
  acknowledgedAt: timestamp.nullable(),
  escalationLevel: z.number(),
});

const notificationSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  sentAt: timestamp,
  readAt: timestamp.nullable(),
});

const notificationListSchema = z.object({
  unreadCount: z.number(),
  notifications: z.array(notificationSchema),
});

export type AlertResponse = z.infer<typeof alertSchema>;
export type NotificationResponse = z.infer<typeof notificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListSchema>;

export function fetchAlerts(): Promise<AlertResponse[]> {
  return apiGet("/alerts", z.array(alertSchema));
}

export function acknowledgeAlert(id: number): Promise<AlertResponse> {
  return apiPost(`/alerts/${id}/acknowledge`, {}, alertSchema);
}

export function resolveAlert(id: number, disposition: Disposition): Promise<AlertResponse> {
  return apiPost(`/alerts/${id}/resolve`, { disposition }, alertSchema);
}

export function fetchMyNotifications(): Promise<NotificationListResponse> {
  return apiGet("/me/notifications", notificationListSchema);
}

export function markNotificationRead(id: number): Promise<NotificationResponse> {
  return apiPost(`/notifications/${id}/read`, {}, notificationSchema);
}
