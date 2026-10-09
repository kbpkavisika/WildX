import type { RouteRow } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[2fr_1fr_1fr] items-center gap-3";
const COLUMNS = ["Route", "Length", "Points"];

export function RoutesTable({ rows }: { rows: RouteRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Routes" className="flex min-w-[480px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No routes yet. Create one to start assigning patrols.</p>}
        {rows.map((row) => (
          <div key={row.id} role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink last:border-b-0")}>
            <span role="cell" className="truncate font-medium">{row.name}</span>
            <span role="cell" className="text-ink-body">{row.length}</span>
            <span role="cell" className="text-ink-body">{row.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
