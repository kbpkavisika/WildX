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
const PLANNED_ROUTE = { ...LINE, weight: 3, dashArray: "8 8" };
const WALKED_TRACK = { ...LINE, weight: 5 };
const TEAM_ICON = teamIcon({ number: 1, colorIndex: 0, selected: true, offline: false });

interface RangerPatrolMapProps {
  route: LatLng[];
  track: LatLng[];
  waypoints: WaypointView[];
  position: LatLng | null;
  sectors: SectorShape[];
}

export default function RangerPatrolMap({ route, track, waypoints, position, sectors }: RangerPatrolMapProps) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <BaseTiles />
        <FitToData points={route.length > 0 ? route : sectors.flatMap((sector) => sector.rings.flat())} />
        <SectorLayer sectors={sectors} />
        <Polyline positions={route} pathOptions={PLANNED_ROUTE} />
        <Polyline positions={track} pathOptions={WALKED_TRACK} />
        {waypoints.map((waypoint) => (
          <Marker key={waypoint.id} position={waypoint.position} icon={waypointIcon}>
            <Tooltip>{waypoint.label}</Tooltip>
          </Marker>
        ))}
        {position && <Marker position={position} icon={TEAM_ICON} title="Your position" zIndexOffset={1000} />}
      </MapContainer>
    </div>
  );
}
