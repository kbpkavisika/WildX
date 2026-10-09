"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { useRef } from "react";
import { MapContainer, Polygon, Tooltip } from "react-leaflet";
import { BaseTiles } from "@/components/map/base-tiles";
import { FitToData } from "@/components/map/fit-to-data";
import { FitToHighlight } from "@/components/map/fit-to-highlight";
import { MapPanel } from "@/components/map/map-panel";
import { ZoomControls } from "@/components/map/zoom-controls";
import { StatusDot } from "@/components/ui/status-dot";
import { MAP_AREA_FILL_OPACITY, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";
import { useCoverageSelection } from "@/lib/patrols/store";
import type { CoverageSectorView, CoverageView } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

const PATROLLED_STYLE = { className: "fill-map-land stroke-primary", weight: 1.5, dashArray: "6 5", fillOpacity: MAP_AREA_FILL_OPACITY };
const NEGLECTED_STYLE = { className: "fill-negative-bg stroke-negative", weight: 1.5, dashArray: "6 5", fillOpacity: MAP_AREA_FILL_OPACITY };

function SectorRow({ sector }: { sector: CoverageSectorView }) {
  const selected = useCoverageSelection((state) => state.selectedId === sector.id);
  const toggle = useCoverageSelection((state) => state.toggle);
  return (
    <button
      aria-pressed={selected}
      onClick={() => toggle(sector.id)}
      className={cn("flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left", selected ? "bg-surface-sunken" : "hover:bg-surface-muted")}
    >
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="truncate text-label text-ink">{sector.name}</span>
        <span className="truncate text-caption text-ink-muted">{sector.caption}</span>
      </span>
      <StatusDot tone={sector.status.tone}>{sector.status.label}</StatusDot>
    </button>
  );
}

function CoverageLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex max-w-[calc(100%-82px)] flex-wrap items-center gap-3.5 rounded-md border border-line bg-card px-3 py-2 text-caption text-ink-body">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 border-[1.5px] border-dashed border-primary bg-map-land" />
        Patrolled
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 border-[1.5px] border-dashed border-negative bg-negative-bg" />
        Neglected
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-4 border-t-[1.5px] border-dashed border-primary" />
        Park boundary
      </span>
    </div>
  );
}

export default function CoverageMap({ view }: { view: CoverageView }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const selectedId = useCoverageSelection((state) => state.selectedId);
  const toggle = useCoverageSelection((state) => state.toggle);
  const selected = view.sectors.find((sector) => sector.id === selectedId) ?? null;

  return (
    <section aria-label="Coverage map" className="relative min-h-[640px] flex-1 overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        ref={mapRef}
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <BaseTiles />
        <FitToData points={view.sectors.flatMap((sector) => sector.rings.flat())} />
        <FitToHighlight rings={selected?.rings ?? null} />
        {view.sectors.map((sector) => (
          <Polygon
            key={`${sector.id}-${sector.neglected}`}
            positions={sector.rings}
            pathOptions={sector.neglected ? NEGLECTED_STYLE : PATROLLED_STYLE}
            eventHandlers={{ click: () => toggle(sector.id) }}
          >
            {sector.neglected ? (
              <Tooltip permanent direction="center">{sector.name}</Tooltip>
            ) : (
              <Tooltip sticky>{sector.name}</Tooltip>
            )}
          </Polygon>
        ))}
      </MapContainer>
      <MapPanel title="Sectors" count={view.sectors.length}>
        {view.sectors.length === 0 && <p className="m-0 px-3 py-2 text-body text-ink-muted">No sectors in this park yet.</p>}
        {view.sectors.map((sector) => (
          <SectorRow key={sector.id} sector={sector} />
        ))}
      </MapPanel>
      <CoverageLegend />
      <ZoomControls mapRef={mapRef} />
    </section>
  );
}
