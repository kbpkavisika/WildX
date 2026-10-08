import { Chip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { MoreButton } from "@/components/ui/more-button";
import type { PatrolRow } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.7fr_1.4fr_1.1fr_0.9fr_0.9fr_36px] items-center gap-3";
const COLUMNS = ["Patrol", "Leader", "Schedule", "Distance", "Status", "Actions"];

function PatrolTableRow({ row }: { row: PatrolRow }) {
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
      <span role="cell" className="text-ink-body">{row.distance}</span>
      <span role="cell">
        <Chip tone={row.status.tone}>{row.status.label}</Chip>
      </span>
      <span role="cell">
        <MoreButton label={`Options for ${row.code}`} className="size-7" />
      </span>
    </div>
  );
}

export function PatrolsTable({ rows }: { rows: PatrolRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Patrols" className="flex min-w-[760px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader" className={cn(column === "Actions" && "sr-only")}>
              {column}
            </span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No patrols match this filter.</p>}
        {rows.map((row) => (
          <PatrolTableRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
