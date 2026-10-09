import { Pencil, Trash2 } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import type { RouteRow } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[2fr_1fr_1fr_80px] items-center gap-3";
const COLUMNS = ["Route", "Length", "Points"];

interface RoutesTableProps {
  rows: RouteRow[];
  canManage: boolean;
  deletingId: number | null;
  onEdit: (id: number) => void;
  onDelete: (row: RouteRow) => void;
}

export function RoutesTable({ rows, canManage, deletingId, onEdit, onDelete }: RoutesTableProps) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Routes" className="flex min-w-[480px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
          <span role="columnheader" className="sr-only">Actions</span>
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No routes yet. Create one to start assigning patrols.</p>}
        {rows.map((row) => (
          <div key={row.id} role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink last:border-b-0")}>
            <span role="cell" className="truncate font-medium">{row.name}</span>
            <span role="cell" className="text-ink-body">{row.length}</span>
            <span role="cell" className="text-ink-body">{row.points}</span>
            <span role="cell" className="flex justify-end gap-2">
              {canManage && (
                <>
                  <QuietButton aria-label={`Edit ${row.name}`} onClick={() => onEdit(row.id)} className="shrink-0 px-0">
                    <Pencil strokeWidth={1.8} />
                  </QuietButton>
                  <QuietButton
                    aria-label={`Delete ${row.name}`}
                    onClick={() => onDelete(row)}
                    disabled={deletingId === row.id}
                    className="shrink-0 px-0 disabled:opacity-60"
                  >
                    <Trash2 strokeWidth={1.8} />
                  </QuietButton>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
