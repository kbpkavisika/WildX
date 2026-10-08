"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polygon, Polyline, useMap } from "react-leaflet";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_FIT_PADDING_PX } from "@/lib/constants";
import { usePatrolSelection } from "@/lib/patrols/store";
import type { ActivePatrolsView, LatLng } from "@/lib/patrols/types";
import { FieldPanel } from "./field-panel";
import { incidentIcon, teamIcon } from "./map-icons";
import { MapLegend } from "./map-legend";
import { TRACK_STYLES } from "./track-styles";

const SECTOR_STYLE = { className: "fill-map-land stroke-primary", weight: 1.5, dashArray: "6 5", fillOpacity: 1 };
const TRACK_WEIGHT = { selected: 5, idle: 3 };
const TRACK_OPACITY = { selected: 1, idle: 0.5 };
const SELECTED_MARKER_Z = 1000;

function FitToData({ points }: { points: LatLng[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length === 0) return;
    map.fitBounds(points, { padding: [MAP_FIT_PADDING_PX, MAP_FIT_PADDING_PX] });
    fitted.current = true;
  }, [map, points]);
  return null;
}

function ZoomControls({ mapRef }: { mapRef: React.RefObject<LeafletMap | null> }) {
  const buttonClass = "flex size-[34px] cursor-pointer items-center justify-center bg-card text-ink";
  return (
    <div className="absolute right-4 bottom-4 z-[1000] flex flex-col overflow-hidden rounded-sm border border-line bg-card">
      <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className={`${buttonClass} border-b border-line`}>
        <Plus className="size-3.5" strokeWidth={2} />
      </button>
      <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className={buttonClass}>
        <Minus className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

export default function LiveMap({ view }: { view: ActivePatrolsView }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const selectedId = usePatrolSelection((state) => state.selectedId);
  const toggle = usePatrolSelection((state) => state.toggle);
  const points: LatLng[] = [
    ...view.sectors.flatMap((sector) => sector.rings.flat()),
    ...view.patrols.flatMap((patrol) => (patrol.position ? [patrol.position, ...patrol.track] : patrol.track)),
  ];

  return (
    <section aria-label="Live patrol map" className="relative min-h-[640px] flex-1 overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        ref={mapRef}
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <FitToData points={points} />
        {view.sectors.map((sector) => (
          <Polygon key={sector.id} positions={sector.rings} pathOptions={SECTOR_STYLE} />
        ))}
        {view.patrols.map((patrol) => {
          const selected = patrol.id === selectedId;
          return (
            <Polyline
              key={`${patrol.id}-${patrol.colorIndex}`}
              positions={patrol.track}
              pathOptions={{
                className: TRACK_STYLES[patrol.colorIndex].stroke,
                weight: selected ? TRACK_WEIGHT.selected : TRACK_WEIGHT.idle,
                opacity: selected ? TRACK_OPACITY.selected : TRACK_OPACITY.idle,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          );
        })}
        {view.incidents.map((incident) => (
          <Marker key={incident.id} position={incident.position} icon={incidentIcon} title={incident.label} />
        ))}
        {view.patrols.map((patrol) => {
          if (!patrol.position) return null;
          const selected = patrol.id === selectedId;
          return (
            <Marker
              key={patrol.id}
              position={patrol.position}
              title={patrol.title}
              zIndexOffset={selected ? SELECTED_MARKER_Z : 0}
              icon={teamIcon({ ...patrol, selected })}
              eventHandlers={{ click: () => toggle(patrol.id) }}
            />
          );
        })}
      </MapContainer>
      <FieldPanel patrols={view.patrols} />
      <MapLegend />
      <ZoomControls mapRef={mapRef} />
    </section>
  );
}
