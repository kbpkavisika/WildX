import { Chip } from "@/components/ui/chip";
import type { DeviceRow } from "@/lib/devices/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.2fr_1.6fr_0.9fr_0.7fr_1.1fr_1fr] items-center gap-3";
const COLUMNS = ["Device", "Animal or location", "Reports every", "Battery", "Last seen", "Health"];

function DeviceTableRow({ row }: { row: DeviceRow }) {
  return (
    <div role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink")}>
      <span role="cell" className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{row.code}</span>
        <span className="text-caption text-ink-muted">{row.kind}</span>
      </span>
      <span role="cell" className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate">{row.place}</span>
        {row.placeCaption && <span className="truncate text-caption text-ink-muted">{row.placeCaption}</span>}
      </span>
      <span role="cell" className="text-ink-body">{row.interval}</span>
      <span role="cell" className="text-ink-body">{row.battery}</span>
      <span role="cell" className="text-ink-body">{row.lastSeen}</span>
      <span role="cell">
        <Chip tone={row.health.tone}>{row.health.label}</Chip>
      </span>
    </div>
  );
}

export function DevicesTable({ rows }: { rows: DeviceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Devices" className="flex min-w-[760px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No devices match this filter.</p>}
        {rows.map((row) => (
          <DeviceTableRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
