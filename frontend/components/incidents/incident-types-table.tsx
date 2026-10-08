import { Pencil, Trash2 } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { IncidentTypeRow } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

const MANAGE_ROW = "grid grid-cols-[2fr_1fr_1fr_160px] items-center gap-3";
const VIEW_ROW = "grid grid-cols-[2fr_1fr_1fr] items-center gap-3";
const COLUMNS = ["Type", "Default severity", "Status"];

interface IncidentTypesTableProps {
  rows: IncidentTypeRow[];
  canManage: boolean;
  deletingId: number | null;
  onEdit: (id: number) => void;
  onDelete: (row: IncidentTypeRow) => void;
}

export function IncidentTypesTable({ rows, canManage, deletingId, onEdit, onDelete }: IncidentTypesTableProps) {
  const row = canManage ? MANAGE_ROW : VIEW_ROW;
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Incident types" className="flex min-w-[560px] flex-col">
        <div role="row" className={cn(row, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
          {canManage && <span role="columnheader" className="sr-only">Actions</span>}
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No incident types yet.</p>}
        {rows.map((type) => (
          <div key={type.id} role="row" className={cn(row, "border-b border-line-soft py-3 text-body text-ink")}>
            <span role="cell" className="truncate font-medium">{type.name}</span>
            <span role="cell"><Chip tone={type.severity.tone}>{type.severity.label}</Chip></span>
            <span role="cell"><Chip tone={type.status.tone}>{type.status.label}</Chip></span>
            {canManage && (
              <span role="cell" className="flex justify-end gap-2">
                <QuietButton aria-label={`Edit ${type.name}`} onClick={() => onEdit(type.id)}>
                  <Pencil />
                  Edit
                </QuietButton>
                <QuietButton
                  aria-label={`Delete ${type.name}`}
                  disabled={deletingId === type.id}
                  onClick={() => onDelete(type)}
                  className="disabled:opacity-60"
                >
                  <Trash2 />
                  Delete
                </QuietButton>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
