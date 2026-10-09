import { useMemo } from "react";
import { Polyline } from "react-native-maps";
import { BaseMap, toMapPoint } from "@/components/map/base-map";
import { TeamMarker, WaypointMarker } from "@/components/map/markers";
import type { LatLng, SectorShape } from "@/lib/geo";
import type { WaypointView } from "@/lib/patrols/mappers";
import { colors } from "@/lib/theme";

const MAP_HEIGHT = 360;
const PLANNED_WIDTH = 3;
const WALKED_WIDTH = 5;
const PLANNED_DASH = [8, 8];

interface RangerPatrolMapProps {
  route: LatLng[];
  track: LatLng[];
  waypoints: WaypointView[];
  position: LatLng | null;
  sectors: SectorShape[];
}

export function RangerPatrolMap({ route, track, waypoints, position, sectors }: RangerPatrolMapProps) {
  const fitTo = useMemo(() => (route.length > 0 ? route : sectors.flatMap((sector) => sector.rings.flat())), [route, sectors]);
  return (
    <BaseMap height={MAP_HEIGHT} fitTo={fitTo} sectors={sectors} accessibilityLabel="Patrol map">
      {route.length > 1 && (
        <Polyline coordinates={route.map(toMapPoint)} strokeColor={colors.track1} strokeWidth={PLANNED_WIDTH} lineDashPattern={PLANNED_DASH} lineCap="round" lineJoin="round" />
      )}
      {track.length > 1 && (
        <Polyline coordinates={track.map(toMapPoint)} strokeColor={colors.track1} strokeWidth={WALKED_WIDTH} lineCap="round" lineJoin="round" />
      )}
      {waypoints.map((waypoint) => (
        <WaypointMarker key={waypoint.key} position={waypoint.position} label={waypoint.label} />
      ))}
      {position && <TeamMarker position={position} number={1} />}
    </BaseMap>
  );
}
