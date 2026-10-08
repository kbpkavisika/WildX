export interface NotificationRow {
  id: number;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  link: string | null;
}

export interface NotificationsView {
  rows: NotificationRow[];
  unreadCount: number;
}
