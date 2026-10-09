import { useMemo } from "react";
import { BaseMap, type MapLine, type MapMarker } from "@/components/map/base-map";
import type { LatLng, SectorShape } from "@/lib/geo";
import type { WaypointView } from "@/lib/patrols/mappers";
import { colors } from "@/lib/theme";

const MAP_HEIGHT = 360;
const PLANNED_WIDTH = 3;
const WALKED_WIDTH = 5;
const MIN_LINE_POINTS = 2;
const TEAM_NUMBER = "1";

interface RangerPatrolMapProps {
  route: LatLng[];
  track: LatLng[];
  waypoints: WaypointView[];
  position: LatLng | null;
  sectors: SectorShape[];
}

export function RangerPatrolMap({ route, track, waypoints, position, sectors }: RangerPatrolMapProps) {
  const fitTo = useMemo(() => (route.length > 0 ? route : sectors.flatMap((sector) => sector.rings.flat())), [route, sectors]);
  const lines: MapLine[] = [
    { key: "planned", points: route, color: colors.track1, width: PLANNED_WIDTH, dashed: true },
    { key: "walked", points: track, color: colors.track1, width: WALKED_WIDTH },
  ].filter((line) => line.points.length >= MIN_LINE_POINTS);
  const markers: MapMarker[] = waypoints.map((waypoint) => ({ key: waypoint.key, kind: "waypoint", position: waypoint.position, label: waypoint.label }));
  if (position) markers.push({ key: "team", kind: "team", position, label: "Your position", text: TEAM_NUMBER });

  return <BaseMap height={MAP_HEIGHT} fitTo={fitTo} sectors={sectors} lines={lines} markers={markers} accessibilityLabel="Patrol map" />;
}
