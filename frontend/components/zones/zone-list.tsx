"use client";

import { Pencil, Trash2 } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useZonesPage } from "@/lib/zones/store";
import type { ZoneRow } from "@/lib/zones/types";
import { cn } from "@/lib/utils";

interface ZoneListProps {
  rows: ZoneRow[];
  canManage: boolean;
  deletingId: number | null;
  onEdit: (id: number) => void;
  onDelete: (row: ZoneRow) => void;
}

interface ZoneRowItemProps {
  row: ZoneRow;
  canManage: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ZoneRowItem({ row, canManage, deleting, onEdit, onDelete }: ZoneRowItemProps) {
  const selected = useZonesPage((state) => state.selectedId === row.id);
  const toggle = useZonesPage((state) => state.toggle);
  return (
    <div className="flex items-center gap-2">
      <button
        aria-pressed={selected}
        onClick={() => toggle(row.id)}
        className={cn(
          "flex min-w-0 grow cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 rounded-lg p-3 text-left",
          selected ? "bg-surface-sunken" : "hover:bg-surface-muted",
        )}
      >
        <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
          <span className="text-label text-ink">{row.name}</span>
          <span className="text-caption text-ink-muted">{row.caption}</span>
        </span>
        {row.rule ? (
          <span className="inline-flex items-center gap-2 text-caption text-ink-body">
            <Chip tone={row.rule.severity.tone} className="whitespace-nowrap">{row.rule.severity.label}</Chip>
            {row.rule.caption}
          </span>
        ) : (
          <span className="text-caption text-ink-muted">No alert rule</span>
        )}
      </button>
      {canManage && (
        <>
          <QuietButton aria-label={`Edit ${row.name}`} onClick={onEdit} className="shrink-0 px-0">
            <Pencil strokeWidth={1.8} />
          </QuietButton>
          <QuietButton aria-label={`Delete ${row.name}`} onClick={onDelete} disabled={deleting} className="shrink-0 px-0 disabled:opacity-60">
            <Trash2 strokeWidth={1.8} />
          </QuietButton>
        </>
      )}
    </div>
  );
}

export function ZoneList({ rows, canManage, deletingId, onEdit, onDelete }: ZoneListProps) {
  if (rows.length === 0) return <p className="m-0 text-body text-ink-muted">No zones yet.</p>;
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <ZoneRowItem
          key={row.id}
          row={row}
          canManage={canManage}
          deleting={deletingId === row.id}
          onEdit={() => onEdit(row.id)}
          onDelete={() => onDelete(row)}
        />
      ))}
    </div>
  );
}
