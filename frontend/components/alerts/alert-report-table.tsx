import type { AlertReportRow } from "@/lib/alerts/report-types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.2fr_1.6fr_0.7fr_1fr_1fr] items-center gap-3";
const COLUMNS = ["Alert type", "Zone", "Alerts", "Median to acknowledge", "Median to resolve"];

export function AlertReportTable({ rows }: { rows: AlertReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Alerts by type and zone" className="flex min-w-[640px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No alerts raised in this range.</p>}
        {rows.map((row) => (
          <div key={row.key} role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink last:border-b-0")}>
            <span role="cell" className="font-medium">{row.type}</span>
            <span role="cell" className={cn("truncate", !row.hasZone && "text-ink-muted")}>{row.zone}</span>
            <span role="cell">{row.count}</span>
            <span role="cell" className="text-ink-body">{row.acknowledge}</span>
            <span role="cell" className="text-ink-body">{row.resolve}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
