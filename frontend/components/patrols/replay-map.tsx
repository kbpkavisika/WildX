"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, Tooltip } from "react-leaflet";
import { BaseTiles } from "@/components/map/base-tiles";
import { FitToData } from "@/components/map/fit-to-data";
import { SectorLayer } from "@/components/map/sector-layer";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";
import type { LatLng, SectorShape, WaypointView } from "@/lib/patrols/types";
import { teamIcon, waypointIcon } from "./map-icons";
import { TRACK_STYLES } from "./track-styles";

const LINE = { className: TRACK_STYLES[0].stroke, lineCap: "round", lineJoin: "round" } as const;
const FULL_TRACK = { ...LINE, weight: 3, opacity: 0.5 };
const WALKED_TRACK = { ...LINE, weight: 5, opacity: 1 };
const TEAM_ICON = teamIcon({ number: 1, colorIndex: 0, selected: true, offline: false });

interface ReplayMapProps {
  track: LatLng[];
  walked: LatLng[];
  position: LatLng | null;
  waypoints: WaypointView[];
  sectors: SectorShape[];
}

export default function ReplayMap({ track, walked, position, waypoints, sectors }: ReplayMapProps) {
  return (
    <div className="relative min-h-[480px] overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <BaseTiles />
        <FitToData points={track} />
        <SectorLayer sectors={sectors} />
        <Polyline positions={track} pathOptions={FULL_TRACK} />
        <Polyline positions={walked} pathOptions={WALKED_TRACK} />
        {waypoints.map((waypoint) => (
          <Marker key={waypoint.id} position={waypoint.position} icon={waypointIcon}>
            <Tooltip>{waypoint.label}</Tooltip>
          </Marker>
        ))}
        {position && <Marker position={position} icon={TEAM_ICON} title="Team position" zIndexOffset={1000} />}
      </MapContainer>
    </div>
  );
}
