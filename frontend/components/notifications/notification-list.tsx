import type { NotificationRow } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  rows: NotificationRow[];
  onOpen: (row: NotificationRow) => void;
}

function NewMark() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-caption text-primary">
      <span className="size-[7px] rounded-full bg-primary" />
      New
    </span>
  );
}

export function NotificationList({ rows, onOpen }: NotificationListProps) {
  if (rows.length === 0) return <p className="m-0 text-body text-ink-muted">No notifications yet.</p>;
  return (
    <div className="-mx-3 -mt-2 flex flex-col gap-1">
      {rows.map((row) => (
        <button
          key={row.id}
          onClick={() => onOpen(row)}
          className="flex min-h-12 w-full cursor-pointer flex-col gap-0.5 rounded-lg p-3 text-left hover:bg-surface-muted"
        >
          <span className="flex items-center gap-2">
            <span className={cn("grow text-body", row.unread ? "font-semibold text-ink" : "text-ink-body")}>{row.title}</span>
            {row.unread && <NewMark />}
          </span>
          <span className="text-caption text-ink-body">{row.body}</span>
          <span className="text-caption text-ink-muted">{row.time}</span>
        </button>
      ))}
    </div>
  );
}
