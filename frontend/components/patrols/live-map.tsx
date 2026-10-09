"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { useRef } from "react";
import { MapContainer, Marker, Polyline } from "react-leaflet";
import { BaseTiles } from "@/components/map/base-tiles";
import { FitToData } from "@/components/map/fit-to-data";
import { SectorLayer } from "@/components/map/sector-layer";
import { ZoomControls } from "@/components/map/zoom-controls";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import { usePatrolSelection } from "@/lib/patrols/store";
import type { ActivePatrolsView, LatLng } from "@/lib/patrols/types";
import { FieldPanel } from "./field-panel";
import { incidentIcon, teamIcon } from "./map-icons";
import { MapLegend } from "./map-legend";
import { TRACK_STYLES } from "./track-styles";

const TRACK_WEIGHT = { selected: 5, idle: 3 };
const TRACK_OPACITY = { selected: 1, idle: 0.5 };
const SELECTED_MARKER_Z = 1000;

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
        <BaseTiles />
        <FitToData points={points} />
        <SectorLayer sectors={view.sectors} />
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
