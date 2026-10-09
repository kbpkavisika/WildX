import type { PatrolResponse, TrackPointResponse } from "@/lib/api/patrols";
import { PATROL_STATUSES, WAYPOINT_TYPES, type PatrolStatus, type WaypointType } from "@/lib/enums";
import { counted, formatDayLabel, formatKm, formatTime, fromIsoDate, isSameDay } from "@/lib/format";
import { parseLine, pathLengthM, type LatLng } from "@/lib/geo";
import { atBody, bodyOf, pointBody } from "@/lib/outbox/bodies";
import { pendingOfKind } from "@/lib/outbox/overlay";
import { OUTBOX_KINDS, type OutboxRow } from "@/lib/outbox/types";
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
  pending: boolean;
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

function pendingTime(rows: OutboxRow[], kind: typeof OUTBOX_KINDS.PATROL_START | typeof OUTBOX_KINDS.PATROL_END, patrolId: number): string | null {
  const row = pendingOfKind(rows, kind).find((candidate) => candidate.patrolId === patrolId);
  return row ? bodyOf(row, atBody).at : null;
}

export function withPendingPatrolChanges(patrol: PatrolResponse, rows: OutboxRow[]): PatrolResponse {
  const endedAt = pendingTime(rows, OUTBOX_KINDS.PATROL_END, patrol.id);
  if (endedAt) return { ...patrol, status: PATROL_STATUSES.COMPLETED, startedAt: patrol.startedAt ?? pendingTime(rows, OUTBOX_KINDS.PATROL_START, patrol.id), endedAt };
  const startedAt = pendingTime(rows, OUTBOX_KINDS.PATROL_START, patrol.id);
  if (startedAt) return { ...patrol, status: PATROL_STATUSES.ACTIVE, startedAt };
  return patrol;
}

export function activePatrolOf(patrols: PatrolResponse[]): PatrolResponse | undefined {
  return patrols.find((patrol) => patrol.status === PATROL_STATUSES.ACTIVE);
}

function fromServer(point: TrackPointResponse): TrackPoint {
  return {
    key: `s${point.id}`,
    position: [point.lat, point.lng],
    recordedAt: point.recordedAt,
    isWaypoint: point.isWaypoint,
    note: point.note,
    waypointType: point.waypointType,
    pending: false,
  };
}

function fromOutbox(row: OutboxRow): TrackPoint {
  const point = bodyOf(row, pointBody);
  return {
    key: row.id,
    position: [point.lat, point.lng],
    recordedAt: point.recordedAt,
    isWaypoint: point.isWaypoint ?? false,
    note: point.note ?? null,
    waypointType: point.waypointType ?? null,
    pending: true,
  };
}

export function mergeTrack(server: TrackPointResponse[], rows: OutboxRow[], patrolId: number): TrackPoint[] {
  const saved = server.map(fromServer);
  const seen = new Set(saved.map((point) => new Date(point.recordedAt).getTime()));
  const pending = pendingOfKind(rows, OUTBOX_KINDS.TRACK_POINT)
    .filter((row) => row.patrolId === patrolId)
    .map(fromOutbox)
    .filter((point) => !seen.has(new Date(point.recordedAt).getTime()));
  return [...saved, ...pending].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
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
  const sent = points.filter((point) => !point.pending).length;
  return `${formatTime(new Date(last.recordedAt))} · ${counted(sent, "point", "points")} sent`;
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
