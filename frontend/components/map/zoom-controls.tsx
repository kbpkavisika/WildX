"use client";

import type { Map as LeafletMap } from "leaflet";
import { Minus, Plus } from "lucide-react";

const BUTTON = "flex size-[34px] cursor-pointer items-center justify-center bg-card text-ink";

export function ZoomControls({ mapRef }: { mapRef: React.RefObject<LeafletMap | null> }) {
  return (
    <div className="absolute right-4 bottom-4 z-[1000] flex flex-col overflow-hidden rounded-sm border border-line bg-card">
      <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className={`${BUTTON} border-b border-line`}>
        <Plus className="size-3.5" strokeWidth={2} />
      </button>
      <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className={BUTTON}>
        <Minus className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
