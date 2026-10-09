import type { PatrolResponse, TrackPointResponse } from "@/lib/api/patrols";
import { PATROL_STATUSES, WAYPOINT_TYPES, type PatrolStatus, type WaypointType } from "@/lib/enums";
import { counted, formatDayLabel, formatKm, formatTime, fromIsoDate, isSameDay } from "@/lib/format";
import { parseLine, pathLengthM, type LatLng } from "@/lib/geo";
import type { ChipView, DetailFact } from "@/lib/view-types";

const NOT_YET = "Not yet";

export const PATROL_STATUS_DISPLAY: Record<PatrolStatus, ChipView> = {
  [PATROL_STATUSES.ACTIVE]: { tone: "positive", label: "Active" },
  [PATROL_STATUSES.PLANNED]: { tone: "neutral", label: "Scheduled" },
  [PATROL_STATUSES.COMPLETED]: { tone: "done", label: "Completed" },
  [PATROL_STATUSES.CANCELLED]: { tone: "neutral", label: "Cancelled" },
};

export const WAYPOINT_TYPE_LABELS: Record<WaypointType, string> = {
  [WAYPOINT_TYPES.CHECKPOINT]: "Checkpoint",
  [WAYPOINT_TYPES.OBSERVATION]: "Observation",
  [WAYPOINT_TYPES.REST]: "Rest",
  [WAYPOINT_TYPES.OTHER]: "Other",
};

export interface TrackPoint {
  key: string;
  position: LatLng;
  recordedAt: string;
  isWaypoint: boolean;
  note: string | null;
  waypointType: WaypointType | null;
}

export interface WaypointView {
  key: string;
  position: LatLng;
  label: string;
}

export interface RangerPatrolCard {
  id: number;
  title: string;
  caption: string;
  status: ChipView;
}

export interface RangerPatrolView {
  id: number;
  title: string;
  subtitle: string;
  status: ChipView;
  route: LatLng[];
  track: LatLng[];
  waypoints: WaypointView[];
  facts: DetailFact[];
  canStart: boolean;
  isActive: boolean;
  completedAt: string | null;
}

export function activePatrolOf(patrols: PatrolResponse[]): PatrolResponse | undefined {
  return patrols.find((patrol) => patrol.status === PATROL_STATUSES.ACTIVE);
}

function toTrackPoint(point: TrackPointResponse): TrackPoint {
  return {
    key: `s${point.id}`,
    position: [point.lat, point.lng],
    recordedAt: point.recordedAt,
    isWaypoint: point.isWaypoint,
    note: point.note,
    waypointType: point.waypointType,
  };
}

export function toTrack(points: TrackPointResponse[]): TrackPoint[] {
  return points.map(toTrackPoint).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

function waypointLabel(point: TrackPoint): string {
  const parts = [formatTime(new Date(point.recordedAt)), point.waypointType ? WAYPOINT_TYPE_LABELS[point.waypointType] : "Waypoint"];
  return [...parts, ...(point.note ? [point.note] : [])].join(" · ");
}

function dayLabel(patrol: PatrolResponse, now: Date): string {
  const scheduled = fromIsoDate(patrol.scheduledDate);
  return isSameDay(scheduled, now) ? "Today" : formatDayLabel(scheduled);
}

function timeRange(patrol: PatrolResponse): string | null {
  if (!patrol.startedAt) return null;
  const start = formatTime(new Date(patrol.startedAt));
  return patrol.endedAt ? `${start} – ${formatTime(new Date(patrol.endedAt))}` : `From ${start}`;
}

export function toRangerPatrolCards(patrols: PatrolResponse[], now: Date): RangerPatrolCard[] {
  const active = patrols.filter((patrol) => patrol.status === PATROL_STATUSES.ACTIVE);
  const others = patrols.filter((patrol) => patrol.status !== PATROL_STATUSES.ACTIVE);
  return [...active, ...others].map((patrol) => ({
    id: patrol.id,
    title: patrol.route.name,
    caption: timeRange(patrol) ?? `${dayLabel(patrol, now)} · not started`,
    status: PATROL_STATUS_DISPLAY[patrol.status],
  }));
}

function lastPointFact(points: TrackPoint[]): string {
  const last = points[points.length - 1];
  if (!last) return NOT_YET;
  return `${formatTime(new Date(last.recordedAt))} · ${counted(points.length, "point", "points")} sent`;
}

export function toRangerPatrolView(patrol: PatrolResponse, points: TrackPoint[], now: Date): RangerPatrolView {
  const track = points.map((point) => point.position);
  return {
    id: patrol.id,
    title: patrol.route.name,
    subtitle: `${dayLabel(patrol, now)} · ${patrol.rangerName}`,
    status: PATROL_STATUS_DISPLAY[patrol.status],
    route: parseLine(patrol.route.pathGeojson) ?? [],
    track,
    waypoints: points.filter((point) => point.isWaypoint).map((point) => ({ key: point.key, position: point.position, label: waypointLabel(point) })),
    facts: [
      { label: "Started", value: patrol.startedAt ? formatTime(new Date(patrol.startedAt)) : NOT_YET },
      { label: "Last point", value: lastPointFact(points) },
      { label: "Distance", value: formatKm(pathLengthM(track)) },
    ],
    canStart: patrol.status === PATROL_STATUSES.PLANNED,
    isActive: patrol.status === PATROL_STATUSES.ACTIVE,
    completedAt: patrol.status === PATROL_STATUSES.COMPLETED && patrol.endedAt ? formatTime(new Date(patrol.endedAt)) : null,
  };
}
