import { Chip } from "@/components/ui/chip";
import type { IncidentRow } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.5fr_1.1fr_1.1fr_1.1fr_0.8fr_1.3fr] items-center gap-3";
const COLUMNS = ["Incident", "Sector", "Reported by", "Reported", "Severity", "Status"];

interface IncidentTableRowProps {
  row: IncidentRow;
  selected: boolean;
  onSelect: (id: number) => void;
}

function IncidentTableRow({ row, selected, onSelect }: IncidentTableRowProps) {
  return (
    <div
      role="row"
      aria-selected={selected}
      className={cn(ROW, "border-b border-line-soft px-2 py-3 text-body text-ink", selected && "bg-surface-sunken")}
    >
      <span role="cell" className="flex min-w-0 flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={() => onSelect(row.id)}
          aria-pressed={selected}
          className="max-w-full cursor-pointer truncate text-left font-medium text-ink hover:text-primary hover:underline"
        >
          {row.title}
        </button>
        <span className="text-caption text-ink-muted">{row.code}</span>
      </span>
      <span role="cell" className="truncate text-ink-body">{row.sector}</span>
      <span role="cell" className="truncate">{row.reporter}</span>
      <span role="cell" className="text-ink-body">{row.reported}</span>
      <span role="cell"><Chip tone={row.severity.tone}>{row.severity.label}</Chip></span>
      <span role="cell" className="flex min-w-0 flex-col items-start gap-1">
        <Chip tone={row.status.tone}>{row.status.label}</Chip>
        {row.statusNote && (
          <span title={row.statusNote} className="line-clamp-2 text-caption text-ink-muted">{row.statusNote}</span>
        )}
      </span>
    </div>
  );
}

interface IncidentsTableProps {
  rows: IncidentRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function IncidentsTable({ rows, selectedId, onSelect }: IncidentsTableProps) {
  return (
    <div className="max-h-[60vh] overflow-auto overscroll-contain">
      <div role="table" aria-label="Incidents" className="flex min-w-[760px] flex-col">
        <div role="row" className={cn(ROW, "sticky top-0 z-10 border-b border-line bg-card px-2 pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No incidents match these filters.</p>}
        {rows.map((row) => (
          <IncidentTableRow key={row.id} row={row} selected={row.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
