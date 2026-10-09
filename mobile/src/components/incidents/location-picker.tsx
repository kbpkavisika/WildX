import { useMemo } from "react";
import { BaseMap, type MapMarker } from "@/components/map/base-map";
import type { LatLng, SectorShape } from "@/lib/geo";

const MAP_HEIGHT = 280;
const LABELS = { incident: "Incident location", waypoint: "Waypoint location" };

interface LocationPickerProps {
  value: LatLng | null;
  sectors: SectorShape[];
  invalid?: boolean;
  marker?: "incident" | "waypoint";
  onPick?: (position: LatLng) => void;
}

export function LocationPicker({ value, sectors, invalid = false, marker = "incident", onPick }: LocationPickerProps) {
  const fitTo = useMemo(() => {
    const points = sectors.flatMap((sector) => sector.rings.flat());
    return points.length > 0 ? points : value ? [value] : [];
  }, [sectors, value]);
  const markers: MapMarker[] = value ? [{ key: marker, kind: marker, position: value, label: LABELS[marker] }] : [];

  return (
    <BaseMap
      height={MAP_HEIGHT}
      fitTo={fitTo}
      markers={markers}
      focus={value}
      invalid={invalid}
      accessibilityLabel={onPick ? `${LABELS[marker]} map. Tap to set the location.` : `${LABELS[marker]} map`}
      onPick={onPick}
    />
  );
}
