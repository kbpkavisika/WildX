import type { PatrolResponse, TrackPointResponse } from "@/lib/api/patrols";
import { counted } from "@/lib/devices/mappers";
import { PATROL_STATUSES } from "@/lib/enums";
import { formatDayLabel, formatKm, formatTime, fromIsoDate, isSameDay } from "@/lib/format";
import { parseLine, pathLengthM } from "./geo";
import { toTrack, toWaypoints } from "./mappers";
import { STATUS_DISPLAY, timeRange } from "./table-mappers";
import type { RangerPatrolCard, RangerPatrolView } from "./types";

const NOT_YET = "Not yet";

function dayLabel(patrol: PatrolResponse, now: Date): string {
  const scheduled = fromIsoDate(patrol.scheduledDate);
  return isSameDay(scheduled, now) ? "Today" : formatDayLabel(scheduled);
}

export function toRangerPatrolCards(patrols: PatrolResponse[], now: Date): RangerPatrolCard[] {
  const active = patrols.filter((patrol) => patrol.status === PATROL_STATUSES.ACTIVE);
  const others = patrols.filter((patrol) => patrol.status !== PATROL_STATUSES.ACTIVE);
  return [...active, ...others].map((patrol) => ({
    id: patrol.id,
    title: patrol.route.name,
    caption: timeRange(patrol) ?? `${dayLabel(patrol, now)} · not started`,
    status: STATUS_DISPLAY[patrol.status].status,
  }));
}

function lastPointFact(points: TrackPointResponse[]): string {
  const last = points[points.length - 1];
  if (!last) return NOT_YET;
  return `${formatTime(new Date(last.recordedAt))} · ${counted(points.length, "point", "points")} sent`;
}

export function toRangerPatrolView(patrol: PatrolResponse, points: TrackPointResponse[], now: Date): RangerPatrolView {
  const track = toTrack(points);
  return {
    id: patrol.id,
    title: patrol.route.name,
    subtitle: `${dayLabel(patrol, now)} · ${patrol.rangerName}`,
    status: STATUS_DISPLAY[patrol.status].status,
    route: parseLine(patrol.route.pathGeojson) ?? [],
    track,
    waypoints: toWaypoints(points),
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
