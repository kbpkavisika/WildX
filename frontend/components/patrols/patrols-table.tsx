import { Pencil, Trash2 } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { MoreButton } from "@/components/ui/more-button";
import type { PatrolRow } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.7fr_1.4fr_1.1fr_0.9fr_0.9fr_72px] items-center gap-3";
const COLUMNS = ["Patrol", "Leader", "Schedule", "Distance", "Status", "Actions"];

interface PatrolActions {
  canManage: boolean;
  deletingId: number | null;
  onEdit: (id: number) => void;
  onDelete: (row: PatrolRow) => void;
}

function RowActions({ row, canManage, deletingId, onEdit, onDelete }: PatrolActions & { row: PatrolRow }) {
  if (row.canEdit && canManage) {
    return (
      <>
        <QuietButton aria-label={`Edit ${row.code}`} onClick={() => onEdit(row.id)} className="shrink-0 px-0">
          <Pencil strokeWidth={1.8} />
        </QuietButton>
        <QuietButton
          aria-label={`Delete ${row.code}`}
          onClick={() => onDelete(row)}
          disabled={deletingId === row.id}
          className="shrink-0 px-0 disabled:opacity-60"
        >
          <Trash2 strokeWidth={1.8} />
        </QuietButton>
      </>
    );
  }
  return (
    <MoreButton
      label={row.canReplay ? `Replay ${row.code}` : `No replay for ${row.code}`}
      href={row.canReplay ? `/dashboard/patrols/${row.id}` : undefined}
      disabled={!row.canReplay}
      className="size-7"
    />
  );
}

function PatrolTableRow({ row, ...actions }: PatrolActions & { row: PatrolRow }) {
  return (
    <div role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink")}>
      <span role="cell" className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{row.title}</span>
        <span className="text-caption text-ink-muted">{row.code}</span>
      </span>
      <span role="cell" className="flex min-w-0 items-center gap-2">
        <InitialsAvatar initials={row.leaderInitials} />
        <span className="truncate">{row.leaderName}</span>
      </span>
      <span role="cell" className="flex flex-col gap-0.5">
        <span>{row.day}</span>
        {row.time && <span className="text-caption text-ink-muted">{row.time}</span>}
      </span>
      <span role="cell" className="flex flex-col gap-0.5">
        <span className="text-ink-body">{row.distance}</span>
        {row.duration && <span className="text-caption text-ink-muted">{row.duration}</span>}
      </span>
      <span role="cell">
        <Chip tone={row.status.tone}>{row.status.label}</Chip>
      </span>
      <span role="cell" className="flex justify-end gap-2">
        <RowActions row={row} {...actions} />
      </span>
    </div>
  );
}

export function PatrolsTable({ rows, ...actions }: PatrolActions & { rows: PatrolRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Patrols" className="flex min-w-[800px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader" className={cn(column === "Actions" && "sr-only")}>
              {column}
            </span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No patrols match this filter.</p>}
        {rows.map((row) => (
          <PatrolTableRow key={row.id} row={row} {...actions} />
        ))}
      </div>
    </div>
  );
}
