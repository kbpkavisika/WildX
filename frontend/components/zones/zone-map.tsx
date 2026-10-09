"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Polygon, Tooltip, useMap } from "react-leaflet";
import { FitToData } from "@/components/map/fit-to-data";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_FIT_PADDING_PX, MAP_MAX_ZOOM } from "@/lib/constants";
import type { LatLng } from "@/lib/patrols/types";
import { useZonesPage } from "@/lib/zones/store";
import type { ZoneRow } from "@/lib/zones/types";

const ZONE_CLASS = "fill-negative-bg stroke-negative";
const ZONE_STYLE = { weight: 1.5, dashArray: "6 5", fillOpacity: 1 };
const HIGHLIGHT_CLASS = "fill-primary stroke-primary";
const HIGHLIGHT_STYLE = { weight: 2, dashArray: "6 5", fillOpacity: 0.12 };

function FitToHighlight({ rings }: { rings: LatLng[][] | null }) {
  const map = useMap();
  const key = rings ? JSON.stringify(rings.flat()) : null;
  useEffect(() => {
    if (key === null) return;
    const points: LatLng[] = JSON.parse(key);
    map.fitBounds(points, { padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX] });
  }, [map, key]);
  return null;
}

function ZoneMapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex max-w-[calc(100%-32px)] flex-wrap items-center gap-3.5 rounded-md border border-line bg-card px-3 py-2 text-caption text-ink-body">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 border-[1.5px] border-dashed border-negative bg-negative-bg" />
        High-risk zone
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 border-2 border-dashed border-primary bg-primary/12" />
        Selected or new zone
      </span>
    </div>
  );
}

export default function ZoneMap({ rows }: { rows: ZoneRow[] }) {
  const selectedId = useZonesPage((state) => state.selectedId);
  const draft = useZonesPage((state) => state.draft);
  const toggle = useZonesPage((state) => state.toggle);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <section aria-label="Zone map" className="relative h-[360px] overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <FitToData points={rows.flatMap((row) => row.rings.flat())} />
        <FitToHighlight rings={draft ?? selected?.rings ?? null} />
        {rows.map((row) => {
          const highlighted = row.id === selectedId;
          return (
            <Polygon
              key={highlighted ? `selected-${row.id}` : row.id}
              positions={row.rings}
              className={highlighted ? HIGHLIGHT_CLASS : ZONE_CLASS}
              pathOptions={highlighted ? HIGHLIGHT_STYLE : ZONE_STYLE}
              eventHandlers={{ click: () => toggle(row.id) }}
            >
              <Tooltip sticky>{row.name}</Tooltip>
            </Polygon>
          );
        })}
        {draft && <Polygon key="draft" positions={draft} className={HIGHLIGHT_CLASS} pathOptions={HIGHLIGHT_STYLE} interactive={false} />}
      </MapContainer>
      <ZoneMapLegend />
    </section>
  );
}
