"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { FitToData } from "@/components/map/fit-to-data";
import { SectorLayer } from "@/components/map/sector-layer";
import { incidentIcon } from "@/components/patrols/map-icons";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import type { LatLng, SectorShape } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  value: LatLng | null;
  sectors: SectorShape[];
  invalid: boolean;
  onPick: (position: LatLng) => void;
}

function TapToPick({ onPick }: { onPick: (position: LatLng) => void }) {
  useMapEvents({ click: ({ latlng }) => onPick([latlng.lat, latlng.lng]) });
  return null;
}

function FollowValue({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.panTo(value);
  }, [map, value]);
  return null;
}

export default function LocationPicker({ value, sectors, invalid, onPick }: LocationPickerProps) {
  return (
    <div className={cn("relative h-[280px] overflow-hidden rounded-xl border bg-map-ground", invalid ? "border-negative" : "border-line")}>
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="absolute! inset-0 isolate bg-map-ground! font-sans"
      >
        <FitToData points={sectors.flatMap((sector) => sector.rings.flat())} />
        <SectorLayer sectors={sectors} />
        {value && <Marker position={value} icon={incidentIcon} title="Incident location" />}
        <TapToPick onPick={onPick} />
        <FollowValue value={value} />
      </MapContainer>
    </div>
  );
}
