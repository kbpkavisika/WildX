import { Pencil, Trash2 } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import type { SectorResponse } from "@/lib/api/parks";
import { sectorCaption } from "@/lib/parks/forms";

interface SectorListProps {
  sectors: SectorResponse[];
  canManage: boolean;
  deletingId: number | null;
  onEdit: (id: number) => void;
  onDelete: (sector: SectorResponse) => void;
}

export function SectorList({ sectors, canManage, deletingId, onEdit, onDelete }: SectorListProps) {
  if (sectors.length === 0) return <p className="m-0 text-body text-ink-muted">No sectors defined for this park yet.</p>;
  return (
    <div className="flex flex-col gap-1">
      {sectors.map((sector) => (
        <div key={sector.id} className="flex min-h-12 items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-muted">
          <span className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-label text-ink">{sector.name}</span>
            <span className="text-caption text-ink-muted">{sectorCaption(sector)}</span>
          </span>
          {canManage && (
            <>
              <QuietButton aria-label={`Edit ${sector.name}`} onClick={() => onEdit(sector.id)} className="shrink-0 px-0">
                <Pencil strokeWidth={1.8} />
              </QuietButton>
              <QuietButton
                aria-label={`Delete ${sector.name}`}
                onClick={() => onDelete(sector)}
                disabled={deletingId === sector.id}
                className="shrink-0 px-0 disabled:opacity-60"
              >
                <Trash2 strokeWidth={1.8} />
              </QuietButton>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
