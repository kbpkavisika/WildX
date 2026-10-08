"use client";

import { usePathname, useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationRow } from "@/lib/notifications/types";
import { NotificationList } from "./notification-list";
import { UnreadBadge } from "./unread-badge";

export function NotificationsCard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isPending, isError, view, markRead } = useNotifications();

  const open = (row: NotificationRow) => {
    if (row.unread) markRead.mutate(row.id);
    if (row.link && row.link !== pathname) router.push(row.link);
  };

  return (
    <Card label="Notifications">
      <div className="flex items-center gap-2.5">
        <span className="grow">
          <CardTitle>Notifications</CardTitle>
        </span>
        {view && <UnreadBadge count={view.unreadCount} />}
      </div>
      {isPending && <p className="m-0 text-body text-ink-muted">Loading notifications…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load notifications. Retrying.</p>}
      {view && <NotificationList rows={view.rows} onOpen={open} />}
    </Card>
  );
}
