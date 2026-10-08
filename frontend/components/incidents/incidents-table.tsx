import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import type { IncidentRow } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.6fr_1.2fr_1.2fr_1.1fr_0.9fr_0.9fr] items-center gap-3";
const COLUMNS = ["Incident", "Sector", "Reported by", "Reported", "Severity", "Status"];

function IncidentTableRow({ row }: { row: IncidentRow }) {
  return (
    <div role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink")}>
      <span role="cell" className="flex min-w-0 flex-col gap-0.5">
        <Link href={`/dashboard/incidents/${row.id}`} className="truncate font-medium text-ink hover:text-primary hover:underline">
          {row.title}
        </Link>
        <span className="text-caption text-ink-muted">{row.code}</span>
      </span>
      <span role="cell" className="truncate text-ink-body">{row.sector}</span>
      <span role="cell" className="truncate">{row.reporter}</span>
      <span role="cell" className="text-ink-body">{row.reported}</span>
      <span role="cell"><Chip tone={row.severity.tone}>{row.severity.label}</Chip></span>
      <span role="cell"><Chip tone={row.status.tone}>{row.status.label}</Chip></span>
    </div>
  );
}

export function IncidentsTable({ rows }: { rows: IncidentRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Incidents" className="flex min-w-[760px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No incidents match these filters.</p>}
        {rows.map((row) => (
          <IncidentTableRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
