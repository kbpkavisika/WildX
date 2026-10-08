import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { TaskRow } from "@/lib/dispatch/types";

interface TaskListProps {
  title: string;
  rows: TaskRow[];
  isPending: boolean;
  isError: boolean;
  emptyText: string;
}

function TaskContent({ row }: { row: TaskRow }) {
  return (
    <>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="truncate text-body font-medium text-ink">{row.title}</span>
        <span className="truncate text-caption text-ink-muted">{row.caption}</span>
      </span>
      <Chip tone={row.status.tone} className="shrink-0">{row.status.label}</Chip>
    </>
  );
}

const ITEM = "flex min-h-12 items-center gap-3 border-b border-line-soft py-3 last:border-b-0";

export function TaskList({ title, rows, isPending, isError, emptyText }: TaskListProps) {
  return (
    <Card label={title} className="px-4 py-4">
      <CardTitle>{title}</CardTitle>
      {isPending && <p className="m-0 text-body text-ink-muted">Loading…</p>}
      {isError && <p className="m-0 text-body text-negative">Could not load. Retrying.</p>}
      {!isPending && !isError && rows.length === 0 && <p className="m-0 text-body text-ink-muted">{emptyText}</p>}
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => (
          <li key={row.id}>
            {row.href ? (
              <Link href={row.href} className={ITEM}>
                <TaskContent row={row} />
                <ChevronRight className="size-4 shrink-0 text-ink-muted" strokeWidth={2} />
              </Link>
            ) : (
              <div className={ITEM}>
                <TaskContent row={row} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
