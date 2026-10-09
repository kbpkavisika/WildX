import type { CoverageReportRow } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.6fr_1fr_1fr_1.4fr] items-center gap-3";
const COLUMNS = ["Sector", "Track points", "Patrols", "Last visit"];

export function CoverageReportTable({ rows }: { rows: CoverageReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Coverage by sector" className="flex min-w-[560px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No sectors in this park yet.</p>}
        {rows.map((row) => (
          <div key={row.id} role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink last:border-b-0")}>
            <span role="cell" className="truncate font-medium">{row.sector}</span>
            <span role="cell" className="text-ink-body">{row.points}</span>
            <span role="cell" className={row.unvisited ? "font-medium text-negative" : "text-ink-body"}>{row.patrols}</span>
            <span role="cell" className="text-ink-body">{row.lastVisit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
