"use client";

import { Chip } from "@/components/ui/chip";
import { StatusDot } from "@/components/ui/status-dot";
import { useAlertsPage } from "@/lib/alerts/store";
import type { AlertRow } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";
import { ALERT_TONE_STYLES } from "./alert-tones";

function AlertRowButton({ row }: { row: AlertRow }) {
  const selected = useAlertsPage((state) => state.selectedId === row.id);
  const toggle = useAlertsPage((state) => state.toggle);
  return (
    <button
      aria-pressed={selected}
      onClick={() => toggle(row.id)}
      className={cn(
        "flex w-full cursor-pointer flex-wrap items-center gap-3 rounded-lg p-3 text-left",
        selected ? "bg-surface-sunken" : "hover:bg-surface-muted",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold text-white",
          ALERT_TONE_STYLES[row.status.tone].fill,
        )}
      >
        {row.number}
      </span>
      <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span className="text-label text-ink">{row.title}</span>
        <span className="text-caption text-ink-muted">{row.caption}</span>
      </span>
      <span className="inline-flex items-center gap-2.5">
        <Chip tone={row.severity.tone} className="whitespace-nowrap">{row.severity.label}</Chip>
        <StatusDot tone={row.status.tone}>{row.status.label}</StatusDot>
      </span>
    </button>
  );
}

export function AlertList({ rows, emptyLabel }: { rows: AlertRow[]; emptyLabel: string }) {
  if (rows.length === 0) return <p className="m-0 text-body text-ink-muted">{emptyLabel}</p>;
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <AlertRowButton key={row.id} row={row} />
      ))}
    </div>
  );
}
