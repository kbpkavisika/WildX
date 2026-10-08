import { z } from "zod";
import { apiGet, apiPost } from "./client";

const timestamp = z.iso.datetime({ offset: true });

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

export type NotificationResponse = z.infer<typeof notificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListSchema>;

export function fetchMyNotifications(): Promise<NotificationListResponse> {
  return apiGet("/me/notifications", notificationListSchema);
}

export function markNotificationRead(id: number): Promise<NotificationResponse> {
  return apiPost(`/notifications/${id}/read`, {}, notificationSchema);
}
