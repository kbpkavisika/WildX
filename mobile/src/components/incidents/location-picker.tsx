import { useMemo } from "react";
import { BaseMap, type MapMarker } from "@/components/map/base-map";
import type { LatLng, SectorShape } from "@/lib/geo";

const MAP_HEIGHT = 280;

interface LocationPickerProps {
  value: LatLng | null;
  sectors: SectorShape[];
  invalid?: boolean;
  onPick?: (position: LatLng) => void;
}

export function LocationPicker({ value, sectors, invalid = false, onPick }: LocationPickerProps) {
  const fitTo = useMemo(() => {
    const points = sectors.flatMap((sector) => sector.rings.flat());
    return points.length > 0 ? points : value ? [value] : [];
  }, [sectors, value]);
  const markers: MapMarker[] = value ? [{ key: "incident", kind: "incident", position: value, label: "Incident location" }] : [];

  return (
    <BaseMap
      height={MAP_HEIGHT}
      fitTo={fitTo}
      markers={markers}
      focus={value}
      invalid={invalid}
      accessibilityLabel={onPick ? "Incident location map. Tap to set the location." : "Incident location map"}
      onPick={onPick}
    />
  );
}
