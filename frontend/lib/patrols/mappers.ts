import { z } from "zod";
import type { IncidentResponse } from "@/lib/api/incidents";
import type { SectorResponse } from "@/lib/api/parks";
import type { LivePatrolResponse, TrackPointResponse } from "@/lib/api/patrols";
import { TRACK_COLOR_COUNT } from "@/lib/constants";
import { INCIDENT_STATUSES, WAYPOINT_TYPES, type WaypointType } from "@/lib/enums";
import { formatAgo, formatTime } from "@/lib/format";
import type { ActivePatrolsView, IncidentMarker, LatLng, LivePatrolView, SectorShape, WaypointView } from "./types";

const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

export const EMPTY_ACTIVE_PATROLS: ActivePatrolsView = { patrols: [], sectors: [], incidents: [], lastUpdate: null };

const OPEN_INCIDENT_STATUSES = new Set<string>([INCIDENT_STATUSES.NEW, INCIDENT_STATUSES.ASSIGNED]);

export function toSectorShape(sector: SectorResponse): SectorShape | null {
  let geojson: unknown;
  try {
    geojson = JSON.parse(sector.polygonGeojson);
  } catch {
    return null;
  }
  const polygon = polygonSchema.safeParse(geojson);
  if (!polygon.success) return null;
  return {
    id: sector.id,
    name: sector.name,
    rings: polygon.data.coordinates.map((ring) => ring.map(([lng, lat]): LatLng => [lat, lng])),
  };
}

export function toTrack(points: TrackPointResponse[] | undefined): LatLng[] {
  return (points ?? []).map((point) => [point.lat, point.lng]);
}

export const WAYPOINT_TYPE_LABELS: Record<WaypointType, string> = {
  [WAYPOINT_TYPES.CHECKPOINT]: "Checkpoint",
  [WAYPOINT_TYPES.OBSERVATION]: "Observation",
  [WAYPOINT_TYPES.REST]: "Rest",
  [WAYPOINT_TYPES.OTHER]: "Other",
};

function waypointLabel(point: TrackPointResponse): string {
  const parts = [formatTime(new Date(point.recordedAt)), point.waypointType ? WAYPOINT_TYPE_LABELS[point.waypointType] : "Waypoint"];
  return [...parts, ...(point.note ? [point.note] : [])].join(" · ");
}

export function toWaypoints(points: TrackPointResponse[]): WaypointView[] {
  return points
    .filter((point) => point.isWaypoint)
    .map((point) => ({ id: point.id, position: [point.lat, point.lng], label: waypointLabel(point) }));
}

function captionFor(live: LivePatrolResponse, now: Date): string {
  const leader = live.patrol.rangerName;
  if (!live.lastSeenAt) return `${leader} · no contact yet`;
  const lastSeen = new Date(live.lastSeenAt);
  return live.offline ? `${leader} · last seen ${formatTime(lastSeen)}` : `${leader} · ${formatAgo(lastSeen, now)}`;
}

export function toLivePatrol(
  live: LivePatrolResponse,
  index: number,
  track: TrackPointResponse[] | undefined,
  sectorNames: Map<number, string>,
  now: Date,
): LivePatrolView {
  const position = live.lastPosition;
  const sector = position?.sectorId == null ? undefined : sectorNames.get(position.sectorId);
  return {
    id: live.patrol.id,
    number: index + 1,
    colorIndex: index % TRACK_COLOR_COUNT,
    title: sector ? `${live.patrol.route.name} · ${sector}` : live.patrol.route.name,
    caption: captionFor(live, now),
    status: live.offline ? { tone: "negative", label: "Offline" } : { tone: "positive", label: "On route" },
    offline: live.offline,
    position: position ? [position.lat, position.lng] : null,
    track: toTrack(track),
  };
}

export function toIncidentMarkers(incidents: IncidentResponse[]): IncidentMarker[] {
  return incidents.flatMap((incident) =>
    OPEN_INCIDENT_STATUSES.has(incident.status) && incident.lat != null && incident.lng != null
      ? [{
          id: incident.id,
          label: incident.sectorName ? `${incident.typeName} · ${incident.sectorName}` : incident.typeName,
          position: [incident.lat, incident.lng] as LatLng,
        }]
      : [],
  );
}

function latestSeen(patrols: LivePatrolResponse[]): string | null {
  const times = patrols.flatMap((live) => (live.lastSeenAt ? [new Date(live.lastSeenAt).getTime()] : []));
  return times.length ? formatTime(new Date(Math.max(...times))) : null;
}

export function toActivePatrolsView(
  patrols: LivePatrolResponse[],
  tracks: Map<number, TrackPointResponse[]>,
  sectors: SectorResponse[],
  incidents: IncidentResponse[],
  now: Date,
): ActivePatrolsView {
  const sectorNames = new Map(sectors.map((sector) => [sector.id, sector.name]));
  return {
    patrols: patrols.map((live, index) => toLivePatrol(live, index, tracks.get(live.patrol.id), sectorNames, now)),
    sectors: sectors.flatMap((sector) => toSectorShape(sector) ?? []),
    incidents: toIncidentMarkers(incidents),
    lastUpdate: latestSeen(patrols),
  };
}
