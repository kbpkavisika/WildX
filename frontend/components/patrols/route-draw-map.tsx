"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, useMapEvents } from "react-leaflet";
import { BaseTiles } from "@/components/map/base-tiles";
import { FitToData } from "@/components/map/fit-to-data";
import { SectorLayer } from "@/components/map/sector-layer";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";
import type { LatLng, SectorShape } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";
import { teamIcon } from "./map-icons";
import { TRACK_STYLES } from "./track-styles";

const PATH_STYLE = { className: TRACK_STYLES[0].stroke, weight: 3, lineCap: "round", lineJoin: "round" } as const;

interface RouteDrawMapProps {
  points: LatLng[];
  sectors: SectorShape[];
  invalid: boolean;
  onAdd: (point: LatLng) => void;
}

function ClickToAdd({ onAdd }: { onAdd: (point: LatLng) => void }) {
  useMapEvents({ click: ({ latlng }) => onAdd([latlng.lat, latlng.lng]) });
  return null;
}

export default function RouteDrawMap({ points, sectors, invalid, onAdd }: RouteDrawMapProps) {
  return (
    <div className={cn("relative h-[360px] overflow-hidden rounded-lg border bg-map-ground", invalid ? "border-negative" : "border-line")}>
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate cursor-crosshair bg-map-ground! font-sans"
      >
        <BaseTiles />
        <FitToData points={[...sectors.flatMap((sector) => sector.rings.flat()), ...points]} />
        <SectorLayer sectors={sectors} />
        <Polyline positions={points} pathOptions={PATH_STYLE} />
        {points.map((point, index) => (
          <Marker
            key={`${index}-${point.join()}`}
            position={point}
            title={`Point ${index + 1}`}
            icon={teamIcon({ number: index + 1, colorIndex: 0, selected: false, offline: false })}
          />
        ))}
        <ClickToAdd onAdd={onAdd} />
      </MapContainer>
    </div>
  );
}
