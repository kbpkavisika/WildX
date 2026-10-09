"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker } from "react-leaflet";
import { BaseTiles } from "@/components/map/base-tiles";
import { FitToData } from "@/components/map/fit-to-data";
import { incidentIcon } from "@/components/patrols/map-icons";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import type { ReportPoint } from "@/lib/incidents/report-mappers";
import type { SectorShape } from "@/lib/patrols/types";

interface IncidentPointsMapProps {
  points: ReportPoint[];
  sectors: SectorShape[];
}

export default function IncidentPointsMap({ points, sectors }: IncidentPointsMapProps) {
  const fitPoints = [...sectors.flatMap((sector) => sector.rings.flat()), ...points.map((point) => point.position)];
  return (
    <div className="relative h-[360px] overflow-hidden rounded-xl border border-line bg-map-ground">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <BaseTiles />
        <FitToData points={fitPoints} />
        {points.map((point) => (
          <Marker key={point.id} position={point.position} icon={incidentIcon} title={point.label} />
        ))}
      </MapContainer>
    </div>
  );
}
