import type { NotificationListResponse, NotificationResponse } from "@/lib/api/notifications";
import { formatAgo, formatDayTime } from "@/lib/format";
import type { NotificationRow, NotificationsView } from "./types";

const RECENT_MS = 60 * 60 * 1000;

function sentText(sentAt: Date, now: Date): string {
  return now.getTime() - sentAt.getTime() < RECENT_MS ? formatAgo(sentAt, now) : formatDayTime(sentAt, now);
}

function toNotificationRow(notification: NotificationResponse, now: Date): NotificationRow {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    time: sentText(new Date(notification.sentAt), now),
    unread: notification.readAt === null,
    link: notification.link,
  };
}

export function toNotificationsView(response: NotificationListResponse, now: Date): NotificationsView {
  return {
    rows: response.notifications.map((notification) => toNotificationRow(notification, now)),
    unreadCount: response.unreadCount,
  };
}
