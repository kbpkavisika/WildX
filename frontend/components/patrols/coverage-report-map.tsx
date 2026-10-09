"use client";

import "leaflet/dist/leaflet.css";
import type { PathOptions } from "leaflet";
import { MapContainer, Polygon, Tooltip } from "react-leaflet";
import { BaseTiles } from "@/components/map/base-tiles";
import { FitToData } from "@/components/map/fit-to-data";
import { MAP_AREA_FILL_OPACITY, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import type { CoverageLevel, CoverageReportRow, SectorShape } from "@/lib/patrols/types";

const VISITED = { className: "fill-primary stroke-primary", weight: 1.5 };

const LEVEL_STYLES: Record<CoverageLevel, PathOptions> = {
  high: { ...VISITED, fillOpacity: 0.65 },
  medium: { ...VISITED, fillOpacity: 0.4 },
  low: { ...VISITED, fillOpacity: 0.2 },
  none: { className: "fill-negative-bg stroke-negative", weight: 1.5, dashArray: "6 5", fillOpacity: MAP_AREA_FILL_OPACITY },
};

const LEGEND: { label: string; swatch: string }[] = [
  { label: "High", swatch: "border-primary bg-primary/65" },
  { label: "Medium", swatch: "border-primary bg-primary/40" },
  { label: "Low", swatch: "border-primary bg-primary/20" },
  { label: "Not visited", swatch: "border-dashed border-negative bg-negative-bg" },
];

interface CoverageReportMapProps {
  rows: CoverageReportRow[];
  sectors: SectorShape[];
}

export default function CoverageReportMap({ rows, sectors }: CoverageReportMapProps) {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  return (
    <div className="relative h-[360px] overflow-hidden rounded-lg border border-line bg-map-ground">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <BaseTiles />
        <FitToData points={sectors.flatMap((sector) => sector.rings.flat())} />
        {sectors.map((sector) => {
          const row = rowsById.get(sector.id);
          const level = row?.level ?? "none";
          return (
            <Polygon key={`${sector.id}-${level}`} positions={sector.rings} pathOptions={LEVEL_STYLES[level]}>
              <Tooltip sticky>{row?.tooltip ?? sector.name}</Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[1000] flex max-w-[calc(100%-32px)] flex-wrap items-center gap-3.5 rounded-md border border-line bg-card px-3 py-2 text-caption text-ink-body">
        {LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-4 border-[1.5px] ${item.swatch}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
