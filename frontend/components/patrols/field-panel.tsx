"use client";

import { MapPanel } from "@/components/map/map-panel";
import { StatusDot } from "@/components/ui/status-dot";
import { usePatrolSelection } from "@/lib/patrols/store";
import type { LivePatrolView } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";
import { PatrolBadge } from "./patrol-badge";

function PatrolRow({ patrol }: { patrol: LivePatrolView }) {
  const selected = usePatrolSelection((state) => state.selectedId === patrol.id);
  const toggle = usePatrolSelection((state) => state.toggle);
  return (
    <button
      aria-pressed={selected}
      onClick={() => toggle(patrol.id)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left",
        selected ? "bg-surface-sunken" : "hover:bg-surface-muted",
      )}
    >
      <PatrolBadge number={patrol.number} colorIndex={patrol.colorIndex} />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="truncate text-label text-ink">{patrol.title}</span>
        <span className="truncate text-caption text-ink-muted">{patrol.caption}</span>
      </span>
      <StatusDot tone={patrol.status.tone}>{patrol.status.label}</StatusDot>
    </button>
  );
}

export function FieldPanel({ patrols }: { patrols: LivePatrolView[] }) {
  return (
    <MapPanel title="In the field" count={patrols.length}>
      {patrols.length === 0 && <p className="m-0 px-3 py-2 text-body text-ink-muted">No teams in the field right now.</p>}
      {patrols.map((patrol) => (
        <PatrolRow key={patrol.id} patrol={patrol} />
      ))}
    </MapPanel>
  );
}
