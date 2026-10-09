import { useMemo } from "react";
import { BaseMap } from "@/components/map/base-map";
import { IncidentMarker } from "@/components/map/markers";
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

  return (
    <BaseMap
      height={MAP_HEIGHT}
      fitTo={fitTo}
      focus={value}
      invalid={invalid}
      accessibilityLabel={onPick ? "Incident location map. Tap to set the location." : "Incident location map"}
      onPick={onPick}
    >
      {value && <IncidentMarker position={value} />}
    </BaseMap>
  );
}
